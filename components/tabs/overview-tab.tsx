"use client"

import useSWR from "swr"
import { PhoneCall, ShoppingBag, TrendingUp, TrendingDown, CheckCircle2, XCircle, AlertCircle, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface OverviewData {
  wallet_balance: number
  spent_this_month: number
  credited_this_month: number
  cod_count: number
  cart_count: number
  call_stats: { total: number; completed: number; failed: number; no_answer: number; in_progress: number }
}

interface WalletTransaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  status: string
  created_at: string
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

function StatCard({ label, value, sub, trend, icon: Icon, iconColor, iconBg }: StatCardProps) {
  const isUp = trend !== undefined && trend >= 0
  return (
    <div className="bg-white rounded-2xl p-5 hairline">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-full ${isUp ? "bg-[#34c759]/10 text-[#1a7a32]" : "bg-[#ff3b30]/10 text-[#cc0000]"}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight leading-none mb-1">{value}</p>
      <p className="text-[14px] text-[#6e6e73]">{label}</p>
      {sub && <p className="text-[12px] text-[#6e6e73] mt-0.5">{sub}</p>}
    </div>
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
}

function FunnelBar({ label, value, max, color }: FunnelBarProps) {
  const pct = Math.round((value / max) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-[#1d1d1f]">{label}</span>
        <span className="text-[13px] font-semibold text-[#1d1d1f]">{value.toLocaleString("en-IN")}</span>
      </div>
      <div className="h-2 bg-[#f5f5f7] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[11px] text-[#6e6e73] mt-1">{pct}% of total</p>
    </div>
  )
}

interface DonutSegment {
  label: string
  value: number
  color: string
}

function MiniDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  let cumulative = 0
  const r = 40
  const cx = 50
  const cy = 50
  const circumference = 2 * Math.PI * r
  const gap = 2

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        {segments.map((seg) => {
          const pct = seg.value / total
          const dash = pct * circumference - gap
          const offset = cumulative * circumference
          cumulative += pct
          return (
            <circle
              key={seg.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          )
        })}
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[12px] text-[#6e6e73]">{seg.label}</span>
            <span className="text-[12px] font-semibold text-[#1d1d1f] ml-auto pl-3">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function OverviewTab() {
  const { data, isLoading } = useSWR<OverviewData>("/api/overview", fetcher, { refreshInterval: 30000 })
  const { data: walletData } = useSWR<{ balance: number; transactions: WalletTransaction[] }>("/api/wallet", fetcher)

  const fmt = (n: number) => n.toLocaleString("en-IN")
  const fmtRs = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const callTotal = data?.call_stats.total ?? 0
  const callCompleted = data?.call_stats.completed ?? 0
  const callSuccessRate = callTotal > 0 ? Math.round((callCompleted / callTotal) * 100) : 0

  const funnelMax = Math.max(callTotal, data?.cod_count ?? 0, 1)

  // Recent activity derived from real wallet transactions
  const recentTransactions = (walletData?.transactions ?? []).slice(0, 7)

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Total Calls"
          value={isLoading ? "—" : fmt(callTotal)}
          sub="This month"
          icon={PhoneCall} iconColor="text-[#0066cc]" iconBg="bg-[#0066cc]/10"
        />
        <StatCard
          label="COD Confirmed"
          value={isLoading ? "—" : fmt(data?.cod_count ?? 0)}
          sub="In client DB"
          icon={CheckCircle2} iconColor="text-[#34c759]" iconBg="bg-[#34c759]/10"
        />
        <StatCard
          label="Add to Cart"
          value={isLoading ? "—" : fmt(data?.cart_count ?? 0)}
          sub="Abandoned checkouts"
          icon={ShoppingBag} iconColor="text-[#af52de]" iconBg="bg-[#af52de]/10"
        />
        <StatCard
          label="Wallet Balance"
          value={isLoading ? "—" : fmtRs(data?.wallet_balance ?? 0)}
          sub={isLoading ? "" : `₹${(data?.spent_this_month ?? 0).toFixed(2)} spent this month`}
          icon={Wallet} iconColor="text-[#ff9500]" iconBg="bg-[#ff9500]/10"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Call funnel */}
        <div className="bg-white rounded-2xl p-5 hairline lg:col-span-1">
          <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Conversion Funnel</p>
          <p className="text-[12px] text-[#6e6e73] mb-5">Calls → COD → Confirmed</p>
          {callTotal > 0 || (data?.cod_count ?? 0) > 0 ? (
            <div className="space-y-4">
              <FunnelBar label="Total Calls Made" value={callTotal} max={funnelMax} color="#0066cc" />
              <FunnelBar label="Completed" value={callCompleted} max={funnelMax} color="#5ac8fa" />
              <FunnelBar label="COD Confirmed" value={data?.cod_count ?? 0} max={funnelMax} color="#34c759" />
              <FunnelBar label="Abandoned Carts" value={data?.cart_count ?? 0} max={funnelMax} color="#af52de" />
            </div>
          ) : (
            <div className="text-center py-6 text-[13px] text-[#6e6e73]">
              <PhoneCall className="w-8 h-8 text-[#c7c7cc] mx-auto mb-2" />
              No call data yet — load a workflow in the Calls tab
            </div>
          )}
        </div>

        {/* Call status donut */}
        <div className="bg-white rounded-2xl p-5 hairline">
          <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Call Status</p>
          <p className="text-[12px] text-[#6e6e73] mb-5">Distribution this month</p>
          {callTotal > 0 ? (
            <MiniDonut segments={[
              { label: "Completed", value: data?.call_stats.completed ?? 0, color: "#34c759" },
              { label: "No Answer", value: data?.call_stats.no_answer ?? 0, color: "#ff9500" },
              { label: "Failed", value: data?.call_stats.failed ?? 0, color: "#ff3b30" },
              { label: "In Progress", value: data?.call_stats.in_progress ?? 0, color: "#0066cc" },
            ]} />
          ) : (
            <div className="text-center py-6 text-[13px] text-[#6e6e73]">
              <PhoneCall className="w-8 h-8 text-[#c7c7cc] mx-auto mb-2" />
              Configure your workflow ID in the Calls tab to see stats
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl p-5 hairline space-y-4">
          <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Quick Stats</p>
          {[
            { label: "Call Success Rate", value: isLoading ? "—" : `${callSuccessRate}%`, icon: TrendingUp, color: "text-[#34c759]", bg: "bg-[#34c759]/10" },
            { label: "Calls Failed", value: isLoading ? "—" : fmt(data?.call_stats.failed ?? 0), icon: XCircle, color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10" },
            { label: "Spent This Month", value: isLoading ? "—" : `₹${(data?.spent_this_month ?? 0).toFixed(0)}`, icon: Wallet, color: "text-[#ff9500]", bg: "bg-[#ff9500]/10" },
            { label: "Abandoned Carts", value: isLoading ? "—" : fmt(data?.cart_count ?? 0), icon: ShoppingBag, color: "text-[#af52de]", bg: "bg-[#af52de]/10" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-[13px] text-[#6e6e73] flex-1">{s.label}</p>
              <p className="text-[15px] font-semibold text-[#1d1d1f]">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed — real wallet transactions */}
      <div className="bg-white rounded-2xl hairline overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06]">
          <p className="text-[15px] font-semibold text-[#1d1d1f]">Recent Wallet Activity</p>
          <p className="text-[12px] text-[#6e6e73]">Credits &amp; debits on your account</p>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {recentTransactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[#6e6e73]">
              <Wallet className="w-8 h-8 text-[#c7c7cc] mx-auto mb-2" />
              No transactions yet — recharge your wallet to get started
            </div>
          ) : recentTransactions.map((txn) => (
            <div key={txn.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f5f5f7] transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${txn.type === "credit" ? "bg-[#34c759]/10" : "bg-[#ff3b30]/10"}`}>
                {txn.type === "credit"
                  ? <ArrowDownLeft className="w-4 h-4 text-[#34c759]" />
                  : <ArrowUpRight className="w-4 h-4 text-[#ff3b30]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{txn.description || (txn.type === "credit" ? "Wallet Recharge" : "Usage Debit")}</p>
                <p className="text-[11px] text-[#6e6e73]">{timeAgo(txn.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className={`text-[14px] font-semibold ${txn.type === "credit" ? "text-[#34c759]" : "text-[#ff3b30]"}`}>
                  {txn.type === "credit" ? "+" : "−"}₹{Number(txn.amount).toLocaleString("en-IN")}
                </p>
                {txn.status === "success"
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                  : txn.status === "failed"
                  ? <XCircle className="w-3.5 h-3.5 text-[#ff3b30]" />
                  : <AlertCircle className="w-3.5 h-3.5 text-[#ff9500]" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
