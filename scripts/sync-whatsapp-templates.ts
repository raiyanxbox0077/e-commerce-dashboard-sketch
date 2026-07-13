/**
 * One-time sync script: fetches all approved WhatsApp message templates
 * from BotSailor and upserts them into the whatsapp_templates table.
 *
 * Usage:
 *   SUPABASE_URL=https://iaisgphpjgwmrzkffvgu.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   BOTSAILOR_API_KEY=... \
 *   BOTSAILOR_PHONE_ID=... \
 *   npx tsx scripts/sync-whatsapp-templates.ts
 */

import { createClient } from '@supabase/supabase-js'

const BOTSAILOR_BASE = 'https://botsailor.com/api/v1'

interface BotSailorTemplate {
  id: number
  template_name: string
  body_content: string
  button_content: string
  status: string
  button_type: string
}

async function main() {
  const bsKey = process.env.BOTSAILOR_API_KEY
  const bsPid = process.env.BOTSAILOR_PHONE_ID
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!bsKey || !bsPid || !supabaseUrl || !supabaseKey) {
    console.error('Missing required env vars. See usage in header.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Fetch templates from BotSailor
  console.log('[sync] Fetching templates from BotSailor...')
  const params = new URLSearchParams({
    apiToken: bsKey,
    phone_number_id: bsPid,
  })
  const res = await fetch(`${BOTSAILOR_BASE}/whatsapp/template/list?${params}`)
  const data = await res.json()

  if (String(data?.status) !== '1') {
    console.error('[sync] BotSailor API error:', data?.message ?? 'unknown')
    process.exit(1)
  }

  const templates = (data.message ?? []) as BotSailorTemplate[]
  console.log(`[sync] Got ${templates.length} templates`)

  // 2. Parse and upsert
  for (const t of templates) {
    const buttonContentRaw = t.button_content ?? '[]'
    let parsedButtons: unknown = []
    try {
      parsedButtons = JSON.parse(buttonContentRaw)
    } catch {
      parsedButtons = []
    }

    const { error } = await supabase
      .from('whatsapp_templates')
      .upsert(
        {
          template_name: t.template_name,
          body_content: t.body_content ?? '',
          button_content: parsedButtons,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'template_name' }
      )

    if (error) {
      console.error(`[sync] Error upserting ${t.template_name}:`, error.message)
    } else {
      const btnCount = Array.isArray(parsedButtons) ? 0 : (parsedButtons as Record<string, unknown[]>)
      console.log(`[sync] Upserted: ${t.template_name}, buttons: ${buttonContentRaw !== '[]' ? 'yes' : 'none'}`)
    }
  }

  console.log('[sync] Done.')
}

main().catch(err => {
  console.error('[sync] Fatal error:', err)
  process.exit(1)
})