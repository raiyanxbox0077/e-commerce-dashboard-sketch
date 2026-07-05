import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Calls BotSailor myInfo to retrieve the phone_number_id automatically
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('botsailor_api_key')
    .eq('user_id', user.id)
    .single()

  const apiKey = tenant?.botsailor_api_key
  if (!apiKey) return NextResponse.json({ error: 'BotSailor API key not configured.' }, { status: 400 })

  const res = await fetch(`https://botsailor.com/api/v1/user/myInfo?apiToken=${apiKey}`)
  const data = await res.json()

  if (data?.status !== '1') {
    return NextResponse.json({ error: data?.message ?? 'BotSailor API key is invalid.' }, { status: 400 })
  }

  // Extract all connected WhatsApp accounts
  const accounts: { phone_number_id: string; display_phone_number: string; name: string }[] =
    (data?.message?.whatsapp_bots_details ?? []).map((a: Record<string, string>) => ({
      phone_number_id: a.phone_number_id,
      display_phone_number: a.display_phone_number,
      name: a.whatsapp_business_name,
    }))

  return NextResponse.json({ accounts })
}
