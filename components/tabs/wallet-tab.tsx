"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, CreditCard, Smartphone, Building2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]
const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", icon: Building2 },
]

interface WalletData {
  balance: number
  transactions: Array<{
    id: string
    type: "credit" | "debit"
    amount: number
    description: string
    razorpay_payment_id?: string
    status: string
    created_at: string
  }>
}

export function WalletTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { data, isLoading, mutate } = useSWR<WalletData>("/api/wallet", fetcher)
  const [amount, setAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [method, setMethod] = useState("upi")
  const [recharging, setRecharging] = useState(false)
  const [recharged, setRecharged] = useState(false)

  const finalAmount = amount ?? (customAmount ? parseFloat(customAmount) : 0)
  const balance = data?.balance ?? 0
  const transactions = data?.transactions ?? []

  async function loadRazorpay(): Promise<boolean> {
    return new Promise(resolve => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handleRecharge() {
    if (finalAmount < 10 || recharging) return
    setRecharging(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) throw new Error("Razorpay failed to load")

      const res = await fetch("/api/wallet/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      })
      const order = await res.json()
      if (order.error) throw new Error(order.error)

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "AI Dashboard",
        description: "Wallet Recharge",
        order_id: order.order_id,
        prefill: { method },
        theme: { color: "#0066cc" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await fetch("/api/wallet/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: order.amount,
            }),
          })
          setRecharged(true)
          setAmount(null)
          setCustomAmount("")
          mutate()
          globalMutate("/api/tenant")
          setTimeout(() => setRecharged(false), 3000)
        },
      })
      rzp.open()
    } catch (e) {
      console.error(e)
    } finally {
      setRecharging(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Balance hero */}
      <div className="bg-[#0066cc] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[14px] text-white/70 mb-1">Available Balance</p>
            {isLoading ? (
              <div className="h-10 w-40 bg-white/20 rounded-xl animate-pulse" />
            ) : (
              <p className="text-[40px] font-semibold tracking-tight leading-none">
                &#8377;{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[12px] text-white/70 mb-1.5">
            <span>Monthly usage</span>
            <span>
              &#8377;{transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0).toFixed(2)} spent
            </span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full w-[15%]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recharge card */}
        <div className="bg-white rounded-2xl hairline p-5 space-y-5">
          <div>
            <p className="text-[15px] font-semibold text-[#1d1d1f]">Add Credits</p>
            <p className="text-[12px] text-[#6e6e73] mt-0.5">Powered by Razorpay — &#8377;1 = 1 credit</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Quick select</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustomAmount("") }}
                  className={cn(
                    "py-2.5 rounded-xl text-[14px] font-semibold transition-all active:scale-95",
                    amount === a ? "bg-[#0066cc] text-white" : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ebebf0]"
                  )}
                >
                  &#8377;{a.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Custom amount</p>
            <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-xl px-4 py-3">
              <span className="text-[15px] font-medium text-[#6e6e73]">&#8377;</span>
              <input
                type="number"
                min="10"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount(null) }}
                placeholder="Enter amount (min ₹10)"
                className="bg-transparent text-[15px] text-[#1d1d1f] outline-none w-full placeholder:text-[#6e6e73]"
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Payment method</p>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
                    method === m.id ? "border-[#0066cc] bg-[#0066cc]/5" : "border-black/[0.08] hover:border-black/20"
                  )}
                >
                  <m.icon className={cn("w-5 h-5", method === m.id ? "text-[#0066cc]" : "text-[#6e6e73]")} />
                  <span className={cn("text-[11px] font-medium", method === m.id ? "text-[#0066cc]" : "text-[#6e6e73]")}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRecharge}
            disabled={finalAmount < 10 || recharging}
            className={cn(
              "w-full py-3.5 rounded-full text-[15px] font-semibold transition-all active:scale-[0.97]",
              finalAmount >= 10 && !recharging
                ? recharged ? "bg-[#34c759] text-white" : "bg-[#0066cc] text-white"
                : "bg-[#f5f5f7] text-[#c7c7cc] cursor-not-allowed"
            )}
          >
            {recharged ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Payment Successful
              </span>
            ) : recharging ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                {finalAmount >= 10 ? `Pay ₹${finalAmount.toLocaleString("en-IN")} via Razorpay` : "Add Credits"}
              </span>
            )}
          </button>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl hairline overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <p className="text-[15px] font-semibold text-[#1d1d1f]">Transaction History</p>
            <p className="text-[12px] text-[#6e6e73]">Recent credits and debits</p>
          </div>
          <div className="divide-y divide-black/[0.04] overflow-y-auto" style={{ maxHeight: "340px" }}>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/3" />
                  </div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-16" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-[13px] text-[#6e6e73]">No transactions yet</div>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    t.type === "credit" ? "bg-[#34c759]/10" : "bg-[#ff3b30]/10"
                  )}>
                    {t.type === "credit"
                      ? <ArrowDownLeft className="w-4 h-4 text-[#34c759]" />
                      : <ArrowUpRight className="w-4 h-4 text-[#ff3b30]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{t.description}</p>
                    <p className="text-[11px] text-[#6e6e73]">
                      {new Date(t.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <p className={cn("text-[14px] font-semibold shrink-0", t.type === "credit" ? "text-[#34c759]" : "text-[#ff3b30]")}>
                    {t.type === "credit" ? "+" : "−"}&#8377;{t.amount.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
