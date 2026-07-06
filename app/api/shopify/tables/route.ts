import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Returns all public table names from the connected Supabase project
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use rpc to list tables — anon key can't access information_schema directly
  const { data, error } = await supabase.rpc('list_public_tables')

  if (error) {
    // Fallback: try known table names the user likely has
    return NextResponse.json({
      tables: ['cod_confirmation', 'E-commerce add to cart'],
      warning: 'Could not auto-detect. Create the list_public_tables function or enter table names manually.',
    })
  }

  return NextResponse.json({ tables: data ?? [] })
}
