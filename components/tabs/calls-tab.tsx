"use client"

import { useState } from "react"
import {
  Search, Filter, Download, PhoneCall, PhoneIncoming, PhoneOutgoing,
  ChevronDown, ChevronUp, Play, FileText, Clock, Coins, CheckCircle2,
  XCircle, AlertCircle, Loader2, Phone
} from "lucide-react"
import { cn } from "@/lib/utils"

type CallStatus = "completed" | "failed" | "no_answer" | "in_progress"
type CallType = "outbound" | "inbound"

interface Run {
  id: string
  agent_name: string
  phone_number: string
  contact_name: string
  type: CallType
  status: CallStatus
  duration_sec: number
  cost_inr: number
  created_at: string
  recording_url?: string
  transcript_url?: string
  gathered_context?: Record<string, string>
}

const MOCK_RUNS: Run[] = [
  { id: "run_01jx2a", agent_name: "COD Confirmation Agent", phone_number: "+91 98765 43210", contact_name: "Priya Sharma", type: "outbound", status: "completed", duration_sec: 142, cost_inr: 1.2, created_at: "2026-07-06T10:32:00Z", recording_url: "#", transcript_url: "#", gathered_context: { confirmed: "yes", order_id: "#10482", payment: "COD" } },
  { id: "run_01jx2b", agent_name: "Cart Recovery Agent", phone_number: "+91 87654 32109", contact_name: "Ravi Kumar", type: "outbound", status: "no_answer", duration_sec: 30, cost_inr: 0.3, created_at: "2026-07-06T10:28:00Z" },
  { id: "run_01jx2c", agent_name: "COD Confirmation Agent", phone_number: "+91 76543 21098", contact_name: "Anita Patel", type: "outbound", status: "failed", duration_sec: 8, cost_inr: 0.1, created_at: "2026-07-06T10:24:00Z" },
  { id: "run_01jx2d", agent_name: "Inbound Support Agent", phone_number: "+91 65432 10987", contact_name: "Deepak Singh", type: "inbound", status: "completed", duration_sec: 218, cost_inr: 1.8, created_at: "2026-07-06T10:20:00Z", recording_url: "#", transcript_url: "#", gathered_context: { issue: "order delayed", resolved: "yes" } },
  { id: "run_01jx2e", agent_name: "COD Confirmation Agent", phone_number: "+91 54321 09876", contact_name: "Meera Nair", type: "outbound", status: "completed", duration_sec: 98, cost_inr: 0.9, created_at: "2026-07-06T10:15:00Z", recording_url: "#", transcript_url: "#", gathered_context: { confirmed: "yes", order_id: "#10479" } },
  { id: "run_01jx2f", agent_name: "Cart Recovery Agent", phone_number: "+91 43210 98765", contact_name: "Suresh Reddy", type: "outbound", status: "in_progress", duration_sec: 0, cost_inr: 0, created_at: "2026-07-06T10:40:00Z" },
  { id: "run_01jx2g", agent_name: "COD Confirmation Agent", phone_number: "+91 32109 87654", contact_name: "Lakshmi Iyer", type: "outbound", status: "completed", duration_sec: 175, cost_inr: 1.5, created_at: "2026-07-06T09:55:00Z", recording_url: "#", transcript_url: "#", gathered_context: { confirmed: "no", reason: "out of stock concern" } },
]

const STATUS_CONFIG: Record<CallStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  completed: { label: "Completed", color: "text-[#1a7a32]", bg: "bg-[#34c759]/10", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-[#cc0000]", bg: "bg-[#ff3b30]/10", icon: XCircle },
  no_answer: { label: "No Answer", color: "text-[#8a5900]", bg: "bg-[#ff9500]/10", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "text-[#0066cc]", bg: "bg-[#0066cc]/10", icon: Loader2 },
}

function formatDuration(sec: number) {
  if (!sec) return "—"
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

function RunRow({ run }: { run: Run }) {
  const [expanded, setExpanded] = useState(false)
  const S = STATUS_CONFIG[run.status]
  const SIcon = S.icon

  return (
    <>
      <tr
        className="border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Run ID */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              run.type === "outbound" ? "bg-[#0066cc]/10" : "bg-[#34c759]/10"
            )}>
              {run.type === "outbound"
                ? <PhoneOutgoing className="w-3.5 h-3.5 text-[#0066cc]" />
                : <PhoneIncoming className="w-3.5 h-3.5 text-[#34c759]" />}
            </div>
            <code className="text-[12px] font-mono text-[#6e6e73]">{run.id}</code>
          </div>
        </td>
        {/* Contact */}
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <p className="text-[13px] font-medium text-[#1d1d1f]">{run.contact_name}</p>
          <p className="text-[11px] text-[#6e6e73]">{run.phone_number}</p>
        </td>
        {/* Agent */}
        <td className="px-4 py-3.5 hidden lg:table-cell">
          <p className="text-[13px] text-[#1d1d1f] truncate max-w-[180px]">{run.agent_name}</p>
        </td>
        {/* Status */}
        <td className="px-4 py-3.5">
          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>
            <SIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{S.label}</span>
          </span>
        </td>
        {/* Duration */}
        <td className="px-4 py-3.5 hidden md:table-cell">
          <span className="text-[13px] text-[#1d1d1f]">{formatDuration(run.duration_sec)}</span>
        </td>
        {/* Cost */}
        <td className="px-4 py-3.5 hidden md:table-cell">
          <span className="text-[13px] text-[#1d1d1f]">₹{run.cost_inr.toFixed(2)}</span>
        </td>
        {/* Time */}
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <span className="text-[12px] text-[#6e6e73]">{formatTime(run.created_at)}</span>
        </td>
        {/* Expand */}
        <td className="px-4 py-3.5">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-[#6e6e73]" />
            : <ChevronDown className="w-4 h-4 text-[#6e6e73]" />}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-[#f5f5f7]">
          <td colSpan={8} className="px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Playback */}
              <div className="bg-white rounded-xl p-3.5 hairline">
                <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Recording</p>
                {run.recording_url ? (
                  <a href={run.recording_url} className="inline-flex items-center gap-1.5 text-[13px] text-[#0066cc] font-medium">
                    <Play className="w-4 h-4" /> Play Recording
                  </a>
                ) : <p className="text-[13px] text-[#6e6e73]">Not available</p>}
              </div>
              {/* Transcript */}
              <div className="bg-white rounded-xl p-3.5 hairline">
                <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Transcript</p>
                {run.transcript_url ? (
                  <a href={run.transcript_url} className="inline-flex items-center gap-1.5 text-[13px] text-[#0066cc] font-medium">
                    <FileText className="w-4 h-4" /> View Transcript
                  </a>
                ) : <p className="text-[13px] text-[#6e6e73]">Not available</p>}
              </div>
              {/* Duration & Cost */}
              <div className="bg-white rounded-xl p-3.5 hairline">
                <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Usage</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[13px]">
                    <Clock className="w-3.5 h-3.5 text-[#6e6e73]" />
                    <span className="text-[#1d1d1f]">{formatDuration(run.duration_sec)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <Coins className="w-3.5 h-3.5 text-[#6e6e73]" />
                    <span className="text-[#1d1d1f]">₹{run.cost_inr.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {/* Gathered context */}
              <div className="bg-white rounded-xl p-3.5 hairline">
                <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Gathered Context</p>
                {run.gathered_context ? (
                  <div className="space-y-1">
                    {Object.entries(run.gathered_context).map(([k, v]) => (
                      <div key={k} className="flex gap-1.5 text-[12px]">
                        <span className="text-[#6e6e73] capitalize">{k}:</span>
                        <span className="text-[#1d1d1f] font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[13px] text-[#6e6e73]">None</p>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

type FilterStatus = "all" | CallStatus
type FilterType = "all" | CallType

export function CallsTab() {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [filterType, setFilterType] = useState<FilterType>("all")

  const filtered = MOCK_RUNS.filter((r) => {
    const q = search.toLowerCase()
    const matchQ = !q || r.contact_name.toLowerCase().includes(q) || r.phone_number.includes(q) || r.id.includes(q) || r.agent_name.toLowerCase().includes(q)
    const matchStatus = filterStatus === "all" || r.status === filterStatus
    const matchType = filterType === "all" || r.type === filterType
    return matchQ && matchStatus && matchType
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl hairline px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3.5 py-2">
          <Search className="w-4 h-4 text-[#6e6e73] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search runs, contacts…"
            className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-full placeholder:text-[#6e6e73]"
          />
        </div>
        {/* Status filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {(["all", "completed", "failed", "no_answer", "in_progress"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors",
                filterStatus === s ? "bg-[#0066cc] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0]"
              )}
            >
              {s === "all" ? "All" : s.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        {/* Type filter */}
        <div className="flex items-center gap-1">
          {(["all", "outbound", "inbound"] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors",
                filterType === t ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0]"
              )}
            >
              {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {/* Export */}
        <button className="flex items-center gap-1.5 text-[12px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] px-3 py-1.5 rounded-full hover:bg-[#f5f5f7] transition-colors ml-auto">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                {["Run ID", "Contact", "Agent", "Status", "Duration", "Cost", "Time", ""].map((h) => (
                  <th key={h} className={cn(
                    "px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider",
                    h === "Agent" && "hidden lg:table-cell",
                    h === "Contact" && "hidden sm:table-cell",
                    (h === "Duration" || h === "Cost") && "hidden md:table-cell",
                    h === "Time" && "hidden sm:table-cell",
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Phone className="w-8 h-8 text-[#c7c7cc] mx-auto mb-2" />
                    <p className="text-[14px] text-[#6e6e73]">No runs match your filters</p>
                  </td>
                </tr>
              ) : filtered.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04]">
          <p className="text-[12px] text-[#6e6e73]">{filtered.length} run{filtered.length !== 1 ? "s" : ""}</p>
          <div className="flex items-center gap-2">
            <button className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] transition-colors">Prev</button>
            <span className="text-[12px] font-semibold text-[#0066cc] w-7 h-7 rounded-full bg-[#0066cc]/10 flex items-center justify-center">1</span>
            <button className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
