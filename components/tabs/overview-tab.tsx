"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import {
  PhoneCall, ShoppingBag, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, AlertCircle, Wallet,
  ArrowUpRight, ArrowDownLeft, IndianRupee, BadgeIndianRupee,
  Zap, ShieldCheck, Store,
} from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface RevenueData {
  made: number
  saved: number
  call_cost_savings: number
  total_net: number
  cod_confirmed_count: number
  cod_rejected_count: number
  cart_converted_count: number
  cost_per_minute: number
  total_call_minutes: number
}

interface ShopifyRevenueData {
  configured: boolean
  wa_revenue: number
  order_count: number
  avg_order_value: number
  monthly?: { month: string; revenue: number }[]
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
      className="anim-fade-slide bg-white rounded-[14px] p-5 border border-[#dddddd] flex flex-col gap-2 relative overflow-hidden hover:airbnb-shadow transition-shadow"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-500 text-[#6a6a6a] uppercase tracking-wider">{label}</p>
        <div className={cn("w-7 h-7 rounded-[8px] flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-3.5 h-3.5", iconColor)} />
        </div>
      </div>
      <div>
        <p className={cn(
          "text-[28px] font-semibold text-[#222222] tracking-tight leading-none tabular",
          isLoading && "text-[#dddddd]"
        )}>
          {isLoading ? "—" : display}
        </p>
        {sub && <p className="text-[12px] text-[#929292] mt-1.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium w-fit px-2 py-0.5 rounded-full border",
          isUp
            ? "text-[#00a699] border-[#00a699]/20 bg-[#00a699]/5"
            : "text-[#c13515] border-[#c13515]/20 bg-[#c13515]/5"
        )}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}

function LiveDot() {
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      <span className="anim-ripple absolute inline-flex w-full h-full rounded-full bg-[#00a699]" />
      <span className="anim-pulse-live relative inline-flex rounded-full h-2 w-2 bg-[#00a699]" />
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
        <span className="text-[13px] text-[#3f3f3f]">{label}</span>
        <span className="text-[13px] font-semibold text-[#222222] tabular">{value.toLocaleString("en-IN")}</span>
      </div>
      <div className="h-1.5 bg-[#f2f2f2] rounded-full overflow-hidden">
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
  const { data: shopifyRevData } = useSWR<ShopifyRevenueData>("/api/shopify/revenue", fetcher, { refreshInterval: 300000 })

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

  const waRevenue     = shopifyRevData?.wa_revenue      ?? 0
  const waOrderCount  = shopifyRevData?.order_count     ?? 0
  const waConfigured  = shopifyRevData?.configured      ?? false

  const recentTransactions = (walletData?.transactions ?? []).slice(0, 6)

  return (
    <div className="space-y-5">

      {/* ── Top KPI row — 7 cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
        <KpiCard
          label="Total Calls" rawValue={callTotal}
          sub="Dograh workflows"
          icon={PhoneCall} iconColor="text-[#222222]" iconBg="bg-[#f2f2f2]"
          accentColor="#222222" delay={0} isLoading={isLoading}
        />
        <KpiCard
          label="COD Orders" rawValue={data?.cod_count ?? 0}
          sub="In Supabase"
          icon={CheckCircle2} iconColor="text-[#00a699]" iconBg="bg-[#00a699]/10"
          accentColor="#00a699" delay={60} isLoading={isLoading}
        />
        <KpiCard
          label="Abandoned Carts" rawValue={data?.cart_count ?? 0}
          sub="Outreach queue"
          icon={ShoppingBag} iconColor="text-[#ff385c]" iconBg="bg-[#ff385c]/10"
          accentColor="#ff385c" delay={120} isLoading={isLoading}
        />
        <KpiCard
          label="Call Success" rawValue={callSuccessRate}
          suffix="%" sub={`${callCompleted} completed`}
          icon={TrendingUp} iconColor="text-[#00a699]" iconBg="bg-[#00a699]/10"
          accentColor="#00a699" delay={180} isLoading={isLoading}
        />
        <KpiCard
          label="Wallet Balance" rawValue={data?.wallet_balance ?? 0}
          sub={isLoading ? "" : `₹${(data?.spent_this_month ?? 0).toFixed(0)} spent`}
          icon={Wallet} iconColor="text-[#ff385c]" iconBg="bg-[#ff385c]/10"
          accentColor="#ff385c" delay={240} isLoading={isLoading}
          formatValue={fmtRs}
        />
        <KpiCard
          label="Net Revenue Impact" rawValue={totalNet}
          sub="Made + Saved"
          icon={IndianRupee} iconColor="text-[#222222]" iconBg="bg-[#f2f2f2]"
          accentColor="#222222" delay={300} isLoading={isLoading}
          formatValue={fmtRs}
        />
        <KpiCard
          label="WA Revenue"
          rawValue={waRevenue}
          sub={waConfigured ? `${waOrderCount} orders via WA-` : "Connect Shopify"}
          icon={Store}
          iconColor="text-[#00a699]"
          iconBg="bg-[#00a699]/10"
          accentColor="#00a699"
          delay={360}
          isLoading={isLoading}
          formatValue={fmtRs}
        />
      </div>

      {/* ── Revenue Impact strip ─────────────────────────────────────────────── */}
      <div
        className="anim-fade-slide bg-white rounded-[14px] border border-[#dddddd] p-5"
        style={{ animationDelay: "360ms" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BadgeIndianRupee className="w-4 h-4 text-[#ff385c]" />
          <p className="text-[14px] font-semibold text-[#222222]">Revenue Impact Breakdown</p>
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[#00a699] font-medium">
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
              sub: `${rev?.total_call_minutes ?? 0} mins × ₹${rev?.cost_per_minute ?? 5}/min`,
              icon: Zap,
              color: "#ff9500",
              bg: "bg-[#ff9500]/8",
              desc: `AI handled vs. manual agent at ₹${rev?.cost_per_minute ?? 5}/min`,
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
                className="rounded-[8px] p-4 bg-[#f7f7f7] border border-[#ebebeb]"
                style={{ animationDelay: `${360 + i * 50}ms` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <p className="text-[11px] font-semibold text-[#6a6a6a] uppercase tracking-wider">{item.label}</p>
                </div>
                <p className={cn(
                  "text-[22px] font-semibold tracking-tight tabular mb-1",
                  isLoading && "text-[#dddddd]"
                )} style={{ color: item.color }}>
                  {isLoading ? "—" : fmtRs(animated)}
                </p>
                <p className="text-[11px] text-[#929292]">{item.sub}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Shopify WA Revenue strip (only shown when configured) ───────────── */}
      {waConfigured && (
        <div
          className="anim-fade-slide bg-white rounded-[14px] border border-[#dddddd] p-5"
          style={{ animationDelay: "390ms" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-4 h-4 text-[#00a699]" />
            <p className="text-[14px] font-semibold text-[#222222]">WhatsApp → Shopify Revenue</p>
            <span className="ml-auto text-[11px] font-medium bg-[#95bf47]/10 text-[#5a8a00] px-2 py-0.5 rounded-full">
              WA- discount codes
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#f7f7f7] rounded-[8px] p-4 border border-[#ebebeb]">
              <p className="text-[11px] text-[#6a6a6a] mb-1 uppercase tracking-wider font-medium">Total Revenue</p>
              <p className="text-[20px] font-semibold text-[#222222]">{fmtRs(waRevenue)}</p>
              <p className="text-[11px] text-[#929292] mt-1">from WA-attributed orders</p>
            </div>
            <div className="bg-[#f7f7f7] rounded-[8px] p-4 border border-[#ebebeb]">
              <p className="text-[11px] text-[#6a6a6a] mb-1 uppercase tracking-wider font-medium">Orders</p>
              <p className="text-[20px] font-semibold text-[#222222]">{waOrderCount}</p>
              <p className="text-[11px] text-[#929292] mt-1">paid orders via WhatsApp</p>
            </div>
            <div className="bg-[#f7f7f7] rounded-[8px] p-4 border border-[#ebebeb]">
              <p className="text-[11px] text-[#6a6a6a] mb-1 uppercase tracking-wider font-medium">Avg Order Value</p>
              <p className="text-[20px] font-semibold text-[#222222]">{fmtRs(shopifyRevData?.avg_order_value ?? 0)}</p>
              <p className="text-[11px] text-[#929292] mt-1">per WA-attributed order</p>
            </div>
          </div>
          {(shopifyRevData?.monthly?.length ?? 0) > 0 && (
            <div className="mt-4">
              <p className="text-[12px] text-[#6e6e73] mb-2">Monthly trend</p>
              <div className="flex items-end gap-1.5 h-16">
                {(() => {
                  const months = shopifyRevData!.monthly!
                  const maxVal = Math.max(...months.map(m => m.revenue), 1)
                  return months.map(m => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-[#95bf47]/70 min-h-[4px]"
                        style={{ height: `${Math.max(4, (m.revenue / maxVal) * 52)}px` }}
                        title={`${m.month}: ${fmtRs(m.revenue)}`}
                      />
                      <p className="text-[9px] text-[#aeaeb2]">{m.month.slice(5)}</p>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}
          {!waConfigured && (
            <p className="text-[12px] text-[#6e6e73] mt-2">
              Add your Shopify store domain and admin token in <strong>Settings → Integrations</strong> to enable this panel.
            </p>
          )}
        </div>
      )}

      {/* ── Middle row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversion Funnel */}
        <div
          className="anim-fade-slide bg-white rounded-[14px] border border-[#dddddd] p-5"
          style={{ animationDelay: "420ms" }}
        >
          <p className="text-[14px] font-semibold text-[#222222] mb-0.5">Conversion Funnel</p>
          <p className="text-[12px] text-[#6a6a6a] mb-5">Calls → COD → Cart confirmed</p>
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
          className="anim-fade-slide bg-white rounded-[14px] border border-[#dddddd] p-5 space-y-3"
          style={{ animationDelay: "480ms" }}
        >
          <p className="text-[14px] font-semibold text-[#222222] mb-0.5">Call Quality</p>
          <p className="text-[12px] text-[#6a6a6a] mb-3">Outcome breakdown</p>
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
              <p className="text-[13px] text-[#3f3f3f] flex-1">{s.label}</p>
              <p className="text-[15px] font-semibold text-[#222222] tabular">{s.value.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>

        {/* COD vs Cart quick stats */}
        <div
          className="anim-fade-slide bg-white rounded-[14px] border border-[#dddddd] p-5 space-y-3"
          style={{ animationDelay: "540ms" }}
        >
          <p className="text-[14px] font-semibold text-[#222222] mb-0.5">Order Intelligence</p>
          <p className="text-[12px] text-[#6a6a6a] mb-3">COD + Cart combined</p>
          {[
            { label: "COD Confirmed",      value: rev?.cod_confirmed_count ?? 0,  color: "#34c759" },
            { label: "COD Rejected",       value: rev?.cod_rejected_count ?? 0,  color: "#ff3b30" },
            { label: "Cart Converted",     value: rev?.cart_converted_count ?? 0,                         color: "#0066cc" },
            { label: "Cart Not Responded", value: (data?.cart_count ?? 0) - (rev?.cart_converted_count ?? 0), color: "#ff9500" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full shrink-0" style={{ background: s.color }} />
              <p className="text-[13px] text-[#3f3f3f] flex-1">{s.label}</p>
              <p className="text-[15px] font-semibold text-[#222222] tabular">
                {Math.max(0, s.value).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Wallet Activity ───────────────────────────────────────────── */}
      <div
        className="anim-fade-slide bg-white rounded-[14px] border border-[#dddddd] overflow-hidden"
        style={{ animationDelay: "600ms" }}
      >
        <div className="px-5 py-4 border-b border-[#ebebeb] flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#222222]">Recent Wallet Activity</p>
            <p className="text-[12px] text-[#6a6a6a]">Credits and debits</p>
          </div>
          <p className="text-[13px] font-semibold text-[#222222] tabular">
            {fmtRsDecimal(data?.wallet_balance ?? 0)}
          </p>
        </div>
        <div className="divide-y divide-[#ebebeb]">
          {recentTransactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[#6a6a6a]">
              <Wallet className="w-8 h-8 text-[#dddddd] mx-auto mb-2" />
              No transactions yet — recharge your wallet to get started
            </div>
          ) : recentTransactions.map((txn) => (
            <div key={txn.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f7f7f7] transition-colors">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                txn.type === "credit" ? "bg-[#34c759]/10" : "bg-[#ff3b30]/10"
              )}>
                {txn.type === "credit"
                  ? <ArrowDownLeft className="w-4 h-4 text-[#34c759]" />
                  : <ArrowUpRight className="w-4 h-4 text-[#ff3b30]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#222222] truncate">
                  {txn.description || (txn.type === "credit" ? "Wallet Recharge" : "Usage Debit")}
                </p>
                <p className="text-[11px] text-[#6a6a6a]">{timeAgo(txn.created_at)}</p>
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
