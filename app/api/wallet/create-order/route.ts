import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: Request) {
  // Validate keys are present — avoids a silent crash if env vars are missing on the server
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.' },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { amount?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { amount } = body
  if (!amount || amount < 1) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  // Instantiate inside the handler so missing env vars produce a clear error above, not a crash
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

  let order
  try {
    order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `w_${user.id.slice(0, 8)}_${Date.now().toString().slice(-8)}`.slice(0, 40),
      notes: { user_id: user.id },
    })
  } catch (err: unknown) {
    // Razorpay SDK errors have a nested .error object with description, not err.message
    const rzpErr = err as { error?: { description?: string; code?: string }; statusCode?: number; message?: string }
    const message =
      rzpErr?.error?.description ||
      rzpErr?.message ||
      'Failed to create Razorpay order'
    const code = rzpErr?.error?.code || null
    const statusCode = rzpErr?.statusCode || 502
    console.error('[v0] Razorpay create-order error:', JSON.stringify(rzpErr))
    return NextResponse.json({ error: message, code }, { status: statusCode >= 400 ? statusCode : 502 })
  }

  // key_id is the public Razorpay key — safe to return to the client
  return NextResponse.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId })
}
