import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VOICE_BASE = 'https://voice.larynxai.in'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('voice_api_key')
    .eq('user_id', user.id)
    .single()

  const apiKey = tenant?.voice_api_key
  if (!apiKey) return NextResponse.json({ error: 'Voice API key not configured.' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const workflowId = searchParams.get('workflow_id')
  if (!workflowId) return NextResponse.json({ error: 'workflow_id is required' }, { status: 400 })

  const res = await fetch(
    `${VOICE_BASE}/api/v1/workflow/${workflowId}/runs/${runId}`,
    { headers: { 'X-API-Key': apiKey } }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
