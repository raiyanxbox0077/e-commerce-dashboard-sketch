'use client'

import useSWR from 'swr'

export interface Tenant {
  id: string
  user_id: string
  client_supabase_url: string | null
  client_supabase_anon_key: string | null
  botsailor_api_key: string | null
  botsailor_account_id: string | null
  voice_api_key: string | null
  shopify_domain: string | null
  shopify_admin_token: string | null
  wallet_balance: number
  plan: string
  agent_toggles?: Record<string, boolean> | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useTenant() {
  const { data, error, mutate } = useSWR<Tenant>('/api/tenant', fetcher, {
    revalidateOnFocus: false,
  })

  return {
    tenant: data,
    loading: !data && !error,
    error,
    mutate,
  }
}
