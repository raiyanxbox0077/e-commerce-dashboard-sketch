import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    return NextResponse.json({ error: 'Razorpay not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Parse body — use a different variable name to avoid conflict with the hmac string below
  let parsed: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string; amount?: number }
  try {
    parsed = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = parsed

  // Build HMAC payload — named distinctly to avoid any shadowing conflict
  const hmacPayload = `${razorpay_order_id}|${razorpay_payment_id}`
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(hmacPayload)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
  }

  const amountInRupees = amount / 100

  // Record transaction
  const { error: txError } = await supabase.from('wallet_transactions').insert({
    user_id: user.id,
    type: 'credit',
    amount: amountInRupees,
    description: 'Wallet recharge via Razorpay',
    razorpay_payment_id,
    razorpay_order_id,
    status: 'completed',
  })
  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

  // Update wallet balance
  const { data: tenant } = await supabase
    .from('tenants')
    .select('wallet_balance')
    .eq('user_id', user.id)
    .single()

  const newBalance = (tenant?.wallet_balance ?? 0) + amountInRupees
  await supabase
    .from('tenants')
    .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true, new_balance: newBalance })
}
