"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import {
  PhoneCall, ShoppingBag, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, AlertCircle, Wallet,
  ArrowUpRight, ArrowDownLeft, IndianRupee, BadgeIndianRupee,
  Zap, ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface RevenueData {
  made: number
  saved: number
  call_cost_savings: number
  total_net: number
  cod_rejected_count: number
  cart_converted_count: number
}

interface OverviewData {
  wallet_balance: number
  spent_this_month: number
  credited_this_month: number
  cod_count: number
  cart_count: number
  call_stats: { total: number; completed: number; failed: number; no_answer: number; in_progress: number }
  revenue: RevenueData
}

interface WalletTransaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  status: string
  created_at: string
}

// ─── Count-up hook ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900, started = true) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const prevTarget = useRef(0)

  useEffect(() => {
    if (!started || target === 0) { setValue(target); return }
    const start = prevTarget.current
    const diff = target - start
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + diff * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
      else prevTarget.current = target
    }

    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, started])

  return value
}

// ─── Sub-components ────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  rawValue: number
  prefix?: string
  suffix?: string
  sub?: string
  trend?: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  accentColor: string // left border color
  delay?: number
  isLoading?: boolean
  formatValue?: (v: number) => string
}

function KpiCard({
  label, rawValue, prefix = "", suffix = "", sub, trend,
  icon: Icon, iconColor, iconBg, accentColor, delay = 0, isLoading, formatValue,
}: KpiCardProps) {
  const animated = useCountUp(rawValue, 900, !isLoading)
  const display = formatValue ? formatValue(animated) : `${prefix}${animated.toLocaleString("en-IN")}${suffix}`
  const isUp = trend !== undefined && trend >= 0

  return (
    <div
      className="anim-fade-slide bg-white rounded-2xl p-5 hairline flex flex-col gap-3 relative overflow-hidden"
      style={{ animationDelay: `${delay}ms`, borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-4.5 h-4.5", iconColor)} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full",
            isUp ? "bg-[#34c759]/10 text-[#1a7a32]" : "bg-[#ff3b30]/10 text-[#cc0000]"
          )}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className={cn(
          "text-[26px] font-bold text-[#1d1d1f] tracking-tight leading-none tabular mb-1",
          isLoading && "animate-pulse text-[#c7c7cc]"
        )}>
          {isLoading ? "—" : display}
        </p>
        <p className="text-[13px] font-medium text-[#6e6e73]">{label}</p>
        {sub && <p className="text-[11px] text-[#aeaeb2] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function LiveDot() {
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      <span className="anim-ripple absolute inline-flex w-full h-full rounded-full bg-[#34c759]" />
      <span className="anim-pulse-live relative inline-flex rounded-full h-2 w-2 bg-[#34c759]" />
    </span>
  )
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface FunnelBarProps {
  label: string
  value: number
  max: number
  color: string
  delay?: number
}

function FunnelBar({ label, value, max, color, delay = 0 }: FunnelBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 100)
    return () => clearTimeout(t)
  }, [pct, delay])

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-[#1d1d1f]">{label}</span>
        <span className="text-[13px] font-semibold text-[#1d1d1f] tabular">{value.toLocaleString("en-IN")}</span>
      </div>
      <div className="h-1.5 bg-[#f0f0f5] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, backgroundColor: color, transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </div>
      <p className="text-[11px] text-[#aeaeb2] mt-1">{pct}%</p>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────
export function OverviewTab() {
  const { data, isLoading } = useSWR<OverviewData>("/api/overview", fetcher, { refreshInterval: 30000 })
  const { data: walletData } = useSWR<{ balance: number; transactions: WalletTransaction[] }>("/api/wallet", fetcher)

  const fmtRs = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtRsDecimal = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const callTotal      = data?.call_stats?.total      ?? 0
  const callCompleted  = data?.call_stats?.completed  ?? 0
  const callFailed     = data?.call_stats?.failed     ?? 0
  const callNoAnswer   = data?.call_stats?.no_answer  ?? 0
  const callSuccessRate = callTotal > 0 ? Math.round((callCompleted / callTotal) * 100) : 0
  const funnelMax = Math.max(callTotal, data?.cod_count ?? 0, data?.cart_count ?? 0, 1)

  const rev = data?.revenue
  const revenueMade   = rev?.made             ?? 0
  const revenueSaved  = rev?.saved            ?? 0
  const callSavings   = rev?.call_cost_savings ?? 0
  const totalNet      = rev?.total_net        ?? 0

  const recentTransactions = (walletData?.transactions ?? []).slice(0, 6)

  return (
    <div className="space-y-5">

      {/* ── Top KPI row — 6 cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          label="Total Calls" rawValue={callTotal}
          sub="Dograh workflows"
          icon={PhoneCall} iconColor="text-[#0066cc]" iconBg="bg-[#0066cc]/10"
          accentColor="#0066cc" delay={0} isLoading={isLoading}
        />
        <KpiCard
          label="COD Orders" rawValue={data?.cod_count ?? 0}
          sub="In Supabase"
          icon={CheckCircle2} iconColor="text-[#34c759]" iconBg="bg-[#34c759]/10"
          accentColor="#34c759" delay={60} isLoading={isLoading}
        />
        <KpiCard
          label="Abandoned Carts" rawValue={data?.cart_count ?? 0}
          sub="Outreach queue"
          icon={ShoppingBag} iconColor="text-[#af52de]" iconBg="bg-[#af52de]/10"
          accentColor="#af52de" delay={120} isLoading={isLoading}
        />
        <KpiCard
          label="Call Success" rawValue={callSuccessRate}
          suffix="%" sub={`${callCompleted} completed`}
          icon={TrendingUp} iconColor="text-[#30d158]" iconBg="bg-[#30d158]/10"
          accentColor="#30d158" delay={180} isLoading={isLoading}
        />
        <KpiCard
          label="Wallet Balance" rawValue={data?.wallet_balance ?? 0}
          sub={isLoading ? "" : `₹${(data?.spent_this_month ?? 0).toFixed(0)} spent`}
          icon={Wallet} iconColor="text-[#ff9500]" iconBg="bg-[#ff9500]/10"
          accentColor="#ff9500" delay={240} isLoading={isLoading}
          formatValue={fmtRs}
        />
        <KpiCard
          label="Net Revenue Impact" rawValue={totalNet}
          sub="Made + Saved"
          icon={IndianRupee} iconColor="text-[#0066cc]" iconBg="bg-[#0066cc]/10"
          accentColor="#0066cc" delay={300} isLoading={isLoading}
          formatValue={fmtRs}
        />
      </div>

      {/* ── Revenue Impact strip ─────────────────────────────────────────────── */}
      <div
        className="anim-fade-slide bg-white rounded-2xl hairline p-5"
        style={{ animationDelay: "360ms" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BadgeIndianRupee className="w-4 h-4 text-[#0066cc]" />
          <p className="text-[14px] font-semibold text-[#1d1d1f]">Revenue Impact Breakdown</p>
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[#34c759] font-medium">
            <LiveDot />
            <span>Live</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Revenue Made",
              value: revenueMade,
              sub: `${rev?.cart_converted_count ?? 0} cart orders confirmed`,
              icon: TrendingUp,
              color: "#34c759",
              bg: "bg-[#34c759]/8",
              desc: "Confirmed cart orders (call/WA converted)",
            },
            {
              label: "Revenue Saved",
              value: revenueSaved,
              sub: `${rev?.cod_rejected_count ?? 0} COD rejections avoided`,
              icon: ShieldCheck,
              color: "#0066cc",
              bg: "bg-[#0066cc]/8",
              desc: "Rejected COD × shipping cost avoided",
            },
            {
              label: "Call Cost Savings",
              value: callSavings,
              sub: `${callCompleted} calls × ₹50 agent cost`,
              icon: Zap,
              color: "#ff9500",
              bg: "bg-[#ff9500]/8",
              desc: "AI handled vs. manual agent at ₹50/call",
            },
            {
              label: "Total Net Impact",
              value: totalNet,
              sub: "Made + Saved + Calls",
              icon: IndianRupee,
              color: "#af52de",
              bg: "bg-[#af52de]/8",
              desc: "Combined money made and losses avoided",
            },
          ].map((item, i) => {
            const animated = useCountUp(item.value, 900, !isLoading)
            return (
              <div
                key={item.label}
                className={cn("rounded-xl p-4", item.bg)}
                style={{ animationDelay: `${360 + i * 50}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wide">{item.label}</p>
                </div>
                <p className={cn(
                  "text-[22px] font-bold tracking-tight tabular mb-1",
                  isLoading && "animate-pulse text-[#c7c7cc]"
                )} style={{ color: item.color }}>
                  {isLoading ? "—" : fmtRs(animated)}
                </p>
                <p className="text-[11px] text-[#aeaeb2]">{item.sub}</p>
                <p className="text-[10px] text-[#c7c7cc] mt-1 leading-snug">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Middle row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversion Funnel */}
        <div
          className="anim-fade-slide bg-white rounded-2xl p-5 hairline"
          style={{ animationDelay: "420ms" }}
        >
          <p className="text-[14px] font-semibold text-[#1d1d1f] mb-0.5">Conversion Funnel</p>
          <p className="text-[12px] text-[#6e6e73] mb-5">Calls → COD → Cart confirmed</p>
          <div className="space-y-4">
            <FunnelBar label="Total Calls" value={callTotal} max={funnelMax} color="#0066cc" delay={420} />
            <FunnelBar label="Calls Completed" value={callCompleted} max={funnelMax} color="#5ac8fa" delay={460} />
            <FunnelBar label="Calls Failed" value={callFailed} max={funnelMax} color="#ff3b30" delay={500} />
            <FunnelBar label="COD Orders" value={data?.cod_count ?? 0} max={funnelMax} color="#34c759" delay={540} />
            <FunnelBar label="Abandoned Carts" value={data?.cart_count ?? 0} max={funnelMax} color="#af52de" delay={580} />
          </div>
        </div>

        {/* Call quality */}
        <div
          className="anim-fade-slide bg-white rounded-2xl p-5 hairline space-y-3"
          style={{ animationDelay: "480ms" }}
        >
          <p className="text-[14px] font-semibold text-[#1d1d1f] mb-0.5">Call Quality</p>
          <p className="text-[12px] text-[#6e6e73] mb-3">Outcome breakdown</p>
          {[
            { label: "Completed",   value: callCompleted,               color: "#34c759", icon: CheckCircle2 },
            { label: "No Answer",   value: callNoAnswer,                color: "#ff9500", icon: AlertCircle  },
            { label: "Failed",      value: callFailed,                  color: "#ff3b30", icon: XCircle      },
            { label: "In Progress", value: data?.call_stats?.in_progress ?? 0, color: "#0066cc", icon: PhoneCall },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${s.color}18` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-[13px] text-[#6e6e73] flex-1">{s.label}</p>
              <p className="text-[15px] font-bold text-[#1d1d1f] tabular">{s.value.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>

        {/* COD vs Cart quick stats */}
        <div
          className="anim-fade-slide bg-white rounded-2xl p-5 hairline space-y-3"
          style={{ animationDelay: "540ms" }}
        >
          <p className="text-[14px] font-semibold text-[#1d1d1f] mb-0.5">Order Intelligence</p>
          <p className="text-[12px] text-[#6e6e73] mb-3">COD + Cart combined</p>
          {[
            { label: "COD Confirmed",      value: (data?.cod_count ?? 0) - (rev?.cod_rejected_count ?? 0), color: "#34c759" },
            { label: "COD Rejected",       value: rev?.cod_rejected_count ?? 0,                           color: "#ff3b30" },
            { label: "Cart Converted",     value: rev?.cart_converted_count ?? 0,                         color: "#0066cc" },
            { label: "Cart Not Responded", value: (data?.cart_count ?? 0) - (rev?.cart_converted_count ?? 0), color: "#ff9500" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full shrink-0" style={{ background: s.color }} />
              <p className="text-[13px] text-[#6e6e73] flex-1">{s.label}</p>
              <p className="text-[15px] font-bold text-[#1d1d1f] tabular">
                {Math.max(0, s.value).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Wallet Activity ───────────────────────────────────────────── */}
      <div
        className="anim-fade-slide bg-white rounded-2xl hairline overflow-hidden"
        style={{ animationDelay: "600ms" }}
      >
        <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#1d1d1f]">Recent Wallet Activity</p>
            <p className="text-[12px] text-[#6e6e73]">Credits and debits</p>
          </div>
          <p className="text-[13px] font-semibold text-[#1d1d1f] tabular">
            {fmtRsDecimal(data?.wallet_balance ?? 0)}
          </p>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {recentTransactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[#6e6e73]">
              <Wallet className="w-8 h-8 text-[#c7c7cc] mx-auto mb-2" />
              No transactions yet — recharge your wallet to get started
            </div>
          ) : recentTransactions.map((txn) => (
            <div key={txn.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f5f5f7] transition-colors">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                txn.type === "credit" ? "bg-[#34c759]/10" : "bg-[#ff3b30]/10"
              )}>
                {txn.type === "credit"
                  ? <ArrowDownLeft className="w-4 h-4 text-[#34c759]" />
                  : <ArrowUpRight className="w-4 h-4 text-[#ff3b30]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1d1d1f] truncate">
                  {txn.description || (txn.type === "credit" ? "Wallet Recharge" : "Usage Debit")}
                </p>
                <p className="text-[11px] text-[#6e6e73]">{timeAgo(txn.created_at)}</p>
              </div>
              <p className={cn(
                "text-[14px] font-bold tabular shrink-0",
                txn.type === "credit" ? "text-[#34c759]" : "text-[#ff3b30]"
              )}>
                {txn.type === "credit" ? "+" : "−"}₹{Number(txn.amount).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
