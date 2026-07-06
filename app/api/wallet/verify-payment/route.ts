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

  let payload: {
    razorpay_order_id?: string
    razorpay_payment_id?: string
    razorpay_signature?: string
    amount?: number
  }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = payload

  // Verify Razorpay signature
  const hmacInput = `${razorpay_order_id}|${razorpay_payment_id}`
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(hmacInput)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
  }

  const amountInRupees = (amount ?? 0) / 100

  // Read current balance
  const { data: tenant, error: readError } = await supabase
    .from('tenants')
    .select('wallet_balance')
    .eq('user_id', user.id)
    .single()

  if (readError) {
    return NextResponse.json({ error: `Failed to read wallet: ${readError.message}` }, { status: 500 })
  }

  const newBalance = Number(tenant?.wallet_balance ?? 0) + amountInRupees

  // Write new balance
  const { error: updateError } = await supabase
    .from('tenants')
    .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: `Failed to update wallet: ${updateError.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, new_balance: newBalance })
}
