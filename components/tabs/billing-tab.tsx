"use client"

import { Download, CheckCircle2, Zap, PhoneCall, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const INVOICES = [
  { id: "INV-0024", date: "2026-07-01", amount: 850, status: "paid", period: "July 2026" },
  { id: "INV-0023", date: "2026-06-01", amount: 1200, status: "paid", period: "June 2026" },
  { id: "INV-0022", date: "2026-05-01", amount: 640, status: "paid", period: "May 2026" },
  { id: "INV-0021", date: "2026-04-01", amount: 980, status: "paid", period: "April 2026" },
]

interface UsageMeterProps {
  label: string
  used: number
  total: number
  unit: string
  color: string
  icon: React.ElementType
}

function UsageMeter({ label, used, total, unit, color, icon: Icon }: UsageMeterProps) {
  const pct = Math.min((used / total) * 100, 100)
  return (
    <div className="bg-[#f5f5f7] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <p className="text-[13px] font-medium text-[#1d1d1f]">{label}</p>
      </div>
      <div className="h-2 bg-black/[0.06] rounded-full mb-2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-[11px] text-[#6e6e73]">
        <span>{used.toLocaleString("en-IN")} {unit} used</span>
        <span>{total.toLocaleString("en-IN")} {unit} total</span>
      </div>
    </div>
  )
}

interface PlanCardProps {
  name: string
  price: number
  features: string[]
  current?: boolean
  recommended?: boolean
}

function PlanCard({ name, price, features, current, recommended }: PlanCardProps) {
  return (
    <div className={cn(
      "rounded-2xl p-5 border-2 transition-all",
      current ? "border-[#0066cc] bg-[#0066cc]/5" : "border-black/[0.08] bg-white"
    )}>
      {(current || recommended) && (
        <span className={cn(
          "inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3",
          current ? "bg-[#0066cc] text-white" : "bg-[#34c759] text-white"
        )}>
          {current ? "Current Plan" : "Recommended"}
        </span>
      )}
      <p className="text-[17px] font-semibold text-[#1d1d1f]">{name}</p>
      <p className="text-[28px] font-semibold text-[#1d1d1f] mt-1">
        ₹{price.toLocaleString("en-IN")}
        <span className="text-[14px] font-normal text-[#6e6e73]">/mo</span>
      </p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[13px] text-[#6e6e73]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759] shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      {!current && (
        <button className="mt-4 w-full py-2.5 rounded-full text-[13px] font-semibold bg-[#0066cc] text-white active:scale-95 transition-transform">
          Upgrade
        </button>
      )}
    </div>
  )
}

export function BillingTab() {
  return (
    <div className="space-y-5">
      {/* Usage summary */}
      <div className="bg-white rounded-2xl hairline p-5">
        <p className="text-[15px] font-semibold text-[#1d1d1f] mb-4">Usage This Month</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UsageMeter label="Call Minutes" used={152} total={500} unit="min" color="#0066cc" icon={PhoneCall} />
          <UsageMeter label="WhatsApp Messages" used={840} total={2000} unit="msg" color="#34c759" icon={MessageCircle} />
          <UsageMeter label="API Credits" used={847} total={5000} unit="₹" color="#af52de" icon={Zap} />
        </div>
      </div>

      {/* Plans */}
      <div>
        <p className="text-[15px] font-semibold text-[#1d1d1f] mb-3">Plans</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PlanCard name="Starter" price={999} current features={["500 call minutes", "2,000 WA messages", "₹5,000 credits", "3 agents", "Email support"]} />
          <PlanCard name="Growth" price={2499} recommended features={["2,000 call minutes", "10,000 WA messages", "₹20,000 credits", "10 agents", "Priority support"]} />
          <PlanCard name="Scale" price={5999} features={["10,000 call minutes", "Unlimited WA messages", "₹1,00,000 credits", "Unlimited agents", "Dedicated support"]} />
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl hairline overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06]">
          <p className="text-[15px] font-semibold text-[#1d1d1f]">Invoices</p>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {INVOICES.map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f5f5f7] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-[#34c759]/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5 text-[#34c759]" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#1d1d1f]">{inv.period}</p>
                <p className="text-[11px] text-[#6e6e73]">{inv.id} · {inv.date}</p>
              </div>
              <p className="text-[14px] font-semibold text-[#1d1d1f]">₹{inv.amount.toLocaleString("en-IN")}</p>
              <button className="p-2 rounded-lg hover:bg-[#f5f5f7] text-[#0066cc] transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
