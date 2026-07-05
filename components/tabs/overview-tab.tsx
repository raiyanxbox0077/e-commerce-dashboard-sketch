"use client"

import { PhoneCall, ShoppingBag, MessageCircle, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

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

interface ActivityItem {
  type: "call" | "order" | "whatsapp"
  title: string
  sub: string
  time: string
  status: "success" | "failed" | "pending"
}

const ACTIVITY: ActivityItem[] = [
  { type: "call", title: "COD Confirmation Call", sub: "+91 98765 43210 · Priya Sharma", time: "2m ago", status: "success" },
  { type: "order", title: "New Add to Cart", sub: "Order #10482 · ₹1,299", time: "5m ago", status: "pending" },
  { type: "whatsapp", title: "WhatsApp Recovery Sent", sub: "+91 87654 32109 · Ravi Kumar", time: "8m ago", status: "success" },
  { type: "call", title: "COD Call Failed", sub: "+91 76543 21098 · Anita Patel", time: "12m ago", status: "failed" },
  { type: "order", title: "COD Confirmed", sub: "Order #10481 · ₹2,499", time: "18m ago", status: "success" },
  { type: "whatsapp", title: "Customer Reply", sub: "+91 65432 10987 · Deepak Singh", time: "24m ago", status: "success" },
  { type: "call", title: "Outbound Campaign Call", sub: "+91 54321 09876 · Meera Nair", time: "31m ago", status: "success" },
]

const STATUS_ICON = {
  success: <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />,
  failed: <XCircle className="w-3.5 h-3.5 text-[#ff3b30]" />,
  pending: <AlertCircle className="w-3.5 h-3.5 text-[#ff9500]" />,
}

const TYPE_ICON = {
  call: <PhoneCall className="w-4 h-4 text-[#0066cc]" />,
  order: <ShoppingBag className="w-4 h-4 text-[#af52de]" />,
  whatsapp: <MessageCircle className="w-4 h-4 text-[#34c759]" />,
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
  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Calls" value="1,284" sub="This month" trend={12} icon={PhoneCall} iconColor="text-[#0066cc]" iconBg="bg-[#0066cc]/10" />
        <StatCard label="COD Confirmed" value="342" sub="83% success rate" trend={8} icon={CheckCircle2} iconColor="text-[#34c759]" iconBg="bg-[#34c759]/10" />
        <StatCard label="Add to Cart" value="891" sub="₹4.2L cart value" trend={-3} icon={ShoppingBag} iconColor="text-[#af52de]" iconBg="bg-[#af52de]/10" />
        <StatCard label="WA Conversations" value="2,107" sub="Avg 3.2 min" trend={21} icon={MessageCircle} iconColor="text-[#34c759]" iconBg="bg-[#34c759]/10" />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Call funnel */}
        <div className="bg-white rounded-2xl p-5 hairline lg:col-span-1">
          <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Conversion Funnel</p>
          <p className="text-[12px] text-[#6e6e73] mb-5">Calls → COD → Confirmed</p>
          <div className="space-y-4">
            <FunnelBar label="Total Calls Made" value={1284} max={1284} color="#0066cc" />
            <FunnelBar label="Connected" value={1047} max={1284} color="#5ac8fa" />
            <FunnelBar label="Interested" value={512} max={1284} color="#af52de" />
            <FunnelBar label="COD Confirmed" value={342} max={1284} color="#34c759" />
          </div>
        </div>

        {/* Call status donut */}
        <div className="bg-white rounded-2xl p-5 hairline">
          <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Call Status</p>
          <p className="text-[12px] text-[#6e6e73] mb-5">Distribution today</p>
          <MiniDonut segments={[
            { label: "Completed", value: 847, color: "#34c759" },
            { label: "No Answer", value: 237, color: "#ff9500" },
            { label: "Failed", value: 124, color: "#ff3b30" },
            { label: "In Progress", value: 76, color: "#0066cc" },
          ]} />
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl p-5 hairline space-y-4">
          <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Quick Stats</p>
          {[
            { label: "Avg Call Duration", value: "2m 18s", icon: Clock, color: "text-[#0066cc]", bg: "bg-[#0066cc]/10" },
            { label: "Recovery Rate", value: "38%", icon: TrendingUp, color: "text-[#34c759]", bg: "bg-[#34c759]/10" },
            { label: "Failed Deliveries", value: "14", icon: XCircle, color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/10" },
            { label: "Active Agents", value: "3", icon: PhoneCall, color: "text-[#af52de]", bg: "bg-[#af52de]/10" },
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

      {/* Activity feed */}
      <div className="bg-white rounded-2xl hairline overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06]">
          <p className="text-[15px] font-semibold text-[#1d1d1f]">Recent Activity</p>
          <p className="text-[12px] text-[#6e6e73]">Calls, orders and messages</p>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {ACTIVITY.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f5f5f7] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#f5f5f7] flex items-center justify-center shrink-0">
                {TYPE_ICON[item.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{item.title}</p>
                <p className="text-[12px] text-[#6e6e73] truncate">{item.sub}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {STATUS_ICON[item.status]}
                <span className="text-[11px] text-[#6e6e73]">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
