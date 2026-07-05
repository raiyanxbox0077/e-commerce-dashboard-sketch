import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = [
    // profile / account
    'name', 'email', 'company_name', 'phone',
    // voice
    'voice_api_key', 'voice_base_url',
    // botsailor
    'botsailor_api_key', 'botsailor_account_id', 'botsailor_phone_id',
    // shopify / client supabase
    'shopify_domain', 'shopify_admin_token', 'shopify_store_domain',
    'client_supabase_url', 'client_supabase_anon_key',
    // razorpay
    'razorpay_key_id', 'razorpay_key_secret',
    // notifications
    'notification_prefs',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('tenants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
