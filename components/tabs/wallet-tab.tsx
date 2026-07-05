"use client"

import { useState } from "react"
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, CreditCard, Smartphone, Building2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const TRANSACTIONS = [
  { id: "txn_1", type: "credit", label: "Razorpay Recharge", amount: 500, balance_after: 847.50, date: "2026-07-06 10:15", method: "UPI" },
  { id: "txn_2", type: "debit", label: "Call: run_01jx2a", amount: 1.20, balance_after: 347.50, date: "2026-07-06 10:32", method: "Usage" },
  { id: "txn_3", type: "debit", label: "Call: run_01jx2d", amount: 1.80, balance_after: 346.30, date: "2026-07-06 10:20", method: "Usage" },
  { id: "txn_4", type: "debit", label: "Call: run_01jx2e", amount: 0.90, balance_after: 344.50, date: "2026-07-06 10:15", method: "Usage" },
  { id: "txn_5", type: "credit", label: "Razorpay Recharge", amount: 200, balance_after: 345.40, date: "2026-07-05 18:00", method: "Card" },
  { id: "txn_6", type: "debit", label: "WhatsApp API: 120 messages", amount: 12.00, balance_after: 145.40, date: "2026-07-05 14:30", method: "Usage" },
  { id: "txn_7", type: "credit", label: "Razorpay Recharge", amount: 100, balance_after: 157.40, date: "2026-07-04 09:00", method: "Net Banking" },
]

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]
const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", icon: Building2 },
]

export function WalletTab() {
  const [amount, setAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [method, setMethod] = useState("upi")
  const [recharged, setRecharged] = useState(false)

  const finalAmount = amount ?? (customAmount ? parseInt(customAmount) : 0)
  const balance = 847.50

  const handleRecharge = () => {
    if (finalAmount >= 10) {
      setRecharged(true)
      setTimeout(() => setRecharged(false), 3000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Balance hero */}
      <div className="bg-[#0066cc] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[14px] text-white/70 mb-1">Available Balance</p>
            <p className="text-[40px] font-semibold tracking-tight leading-none">
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>
        {/* Usage bar */}
        <div>
          <div className="flex justify-between text-[12px] text-white/70 mb-1.5">
            <span>Monthly usage</span>
            <span>₹152.50 / ₹1,000</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: "15.25%" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recharge card */}
        <div className="bg-white rounded-2xl hairline p-5 space-y-5">
          <div>
            <p className="text-[15px] font-semibold text-[#1d1d1f]">Add Credits</p>
            <p className="text-[12px] text-[#6e6e73] mt-0.5">Powered by Razorpay — ₹1 = 1 credit</p>
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Quick select</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustomAmount("") }}
                  className={cn(
                    "py-2.5 rounded-xl text-[14px] font-semibold transition-all active:scale-95",
                    amount === a
                      ? "bg-[#0066cc] text-white"
                      : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ebebf0]"
                  )}
                >
                  ₹{a.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Custom amount</p>
            <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-xl px-4 py-3">
              <span className="text-[15px] font-medium text-[#6e6e73]">₹</span>
              <input
                type="number"
                min="10"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setAmount(null) }}
                placeholder="Enter amount (min ₹10)"
                className="bg-transparent text-[15px] text-[#1d1d1f] outline-none w-full placeholder:text-[#6e6e73]"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Payment method</p>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
                    method === m.id
                      ? "border-[#0066cc] bg-[#0066cc]/5"
                      : "border-black/[0.08] hover:border-black/20"
                  )}
                >
                  <m.icon className={cn("w-5 h-5", method === m.id ? "text-[#0066cc]" : "text-[#6e6e73]")} />
                  <span className={cn("text-[11px] font-medium", method === m.id ? "text-[#0066cc]" : "text-[#6e6e73]")}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recharge button */}
          <button
            onClick={handleRecharge}
            disabled={finalAmount < 10}
            className={cn(
              "w-full py-3.5 rounded-full text-[15px] font-semibold transition-all active:scale-[0.97]",
              finalAmount >= 10
                ? recharged
                  ? "bg-[#34c759] text-white"
                  : "bg-[#0066cc] text-white"
                : "bg-[#f5f5f7] text-[#c7c7cc] cursor-not-allowed"
            )}
          >
            {recharged ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5" /> Payment Successful
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-4.5 h-4.5" />
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
          <div className="divide-y divide-black/[0.04] overflow-y-auto" style={{ maxHeight: "320px" }}>
            {TRANSACTIONS.map((t) => (
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
                  <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{t.label}</p>
                  <p className="text-[11px] text-[#6e6e73]">{t.date} · {t.method}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-[14px] font-semibold", t.type === "credit" ? "text-[#34c759]" : "text-[#ff3b30]")}>
                    {t.type === "credit" ? "+" : "−"}₹{t.amount.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-[#6e6e73]">₹{t.balance_after.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
