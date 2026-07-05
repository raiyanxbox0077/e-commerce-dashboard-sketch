"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Search, Download, PhoneOutgoing, PhoneIncoming,
  ChevronDown, ChevronUp, Play, FileText, Clock, Coins, CheckCircle2,
  XCircle, AlertCircle, Loader2, Phone
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTenant } from "@/hooks/use-tenant"

const fetcher = (url: string) => fetch(url).then(r => r.json())

type CallStatus = "completed" | "failed" | "no_answer" | "in_progress"

interface Run {
  run_id: string
  workflow_id?: string | number
  status: CallStatus
  type?: "outbound" | "inbound"
  phone_number?: string
  contact_name?: string
  agent_name?: string
  duration?: number
  cost?: number
  created_at?: string
  recording_url?: string
  transcript_url?: string
  bot_recording_url?: string
  gathered_context?: Record<string, unknown>
  initial_context?: Record<string, unknown>
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  completed:   { label: "Completed",  color: "text-[#1a7a32]", bg: "bg-[#34c759]/10", icon: CheckCircle2 },
  failed:      { label: "Failed",     color: "text-[#cc0000]", bg: "bg-[#ff3b30]/10", icon: XCircle },
  no_answer:   { label: "No Answer",  color: "text-[#8a5900]", bg: "bg-[#ff9500]/10", icon: AlertCircle },
  in_progress: { label: "In Progress",color: "text-[#0066cc]", bg: "bg-[#0066cc]/10", icon: Loader2 },
}

function formatDuration(sec?: number) {
  if (!sec) return "—"
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function RunRow({ run, workflowId }: { run: Run; workflowId: string }) {
  const [expanded, setExpanded] = useState(false)
  const { data: detail, isLoading: detailLoading } = useSWR(
    expanded ? `/api/calls/${run.run_id}?workflow_id=${workflowId}` : null,
    fetcher
  )

  const S = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.failed
  const SIcon = S.icon
  const isOutbound = run.type !== "inbound"

  return (
    <>
      <tr
        className="border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              isOutbound ? "bg-[#0066cc]/10" : "bg-[#34c759]/10"
            )}>
              {isOutbound
                ? <PhoneOutgoing className="w-3.5 h-3.5 text-[#0066cc]" />
                : <PhoneIncoming className="w-3.5 h-3.5 text-[#34c759]" />}
            </div>
            <code className="text-[12px] font-mono text-[#6e6e73] hidden sm:block">
              {run.run_id.slice(0, 20)}…
            </code>
            <code className="text-[11px] font-mono text-[#6e6e73] sm:hidden">
              {run.run_id.slice(0, 10)}…
            </code>
          </div>
        </td>
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <p className="text-[13px] font-medium text-[#1d1d1f]">{run.contact_name ?? "—"}</p>
          <p className="text-[11px] text-[#6e6e73]">{run.phone_number ?? "—"}</p>
        </td>
        <td className="px-4 py-3.5 hidden lg:table-cell">
          <p className="text-[13px] text-[#1d1d1f] truncate max-w-[180px]">{run.agent_name ?? "—"}</p>
        </td>
        <td className="px-4 py-3.5">
          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>
            <SIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{S.label}</span>
          </span>
        </td>
        <td className="px-4 py-3.5 hidden md:table-cell">
          <span className="text-[13px] text-[#1d1d1f]">{formatDuration(run.duration)}</span>
        </td>
        <td className="px-4 py-3.5 hidden md:table-cell">
          <span className="text-[13px] text-[#1d1d1f]">
            {run.cost !== undefined ? `₹${run.cost.toFixed(4)}` : "—"}
          </span>
        </td>
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <span className="text-[12px] text-[#6e6e73]">
            {run.created_at ? new Date(run.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}
          </span>
        </td>
        <td className="px-4 py-3.5">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-[#6e6e73]" />
            : <ChevronDown className="w-4 h-4 text-[#6e6e73]" />}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-[#f5f5f7]">
          <td colSpan={8} className="px-5 py-4">
            {detailLoading ? (
              <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-1/2" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Recording */}
                <div className="bg-white rounded-xl p-3.5 hairline">
                  <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Recording</p>
                  {detail?.recording_url ? (
                    <audio controls src={detail.recording_url} className="w-full h-9 rounded-lg" />
                  ) : (
                    <p className="text-[13px] text-[#6e6e73]">Not available</p>
                  )}
                </div>
                {/* Transcript */}
                <div className="bg-white rounded-xl p-3.5 hairline">
                  <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Transcript</p>
                  {detail?.transcript_url ? (
                    <a href={detail.transcript_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] text-[#0066cc] font-medium">
                      <FileText className="w-4 h-4" /> View Transcript
                    </a>
                  ) : (
                    <p className="text-[13px] text-[#6e6e73]">Not available</p>
                  )}
                </div>
                {/* Usage */}
                <div className="bg-white rounded-xl p-3.5 hairline">
                  <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Usage</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[13px]">
                      <Clock className="w-3.5 h-3.5 text-[#6e6e73]" />
                      <span>{formatDuration(detail?.duration ?? run.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px]">
                      <Coins className="w-3.5 h-3.5 text-[#6e6e73]" />
                      <span>₹{((detail?.cost ?? run.cost) ?? 0).toFixed(4)}</span>
                    </div>
                  </div>
                </div>
                {/* Gathered context */}
                <div className="bg-white rounded-xl p-3.5 hairline">
                  <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Gathered Context</p>
                  {detail?.gathered_context && Object.keys(detail.gathered_context).length > 0 ? (
                    <div className="space-y-1">
                      {Object.entries(detail.gathered_context).map(([k, v]) => (
                        <div key={k} className="flex gap-1.5 text-[12px]">
                          <span className="text-[#6e6e73] capitalize shrink-0">{k}:</span>
                          <span className="text-[#1d1d1f] font-medium">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#6e6e73]">None</p>
                  )}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

interface Workflow {
  workflow_id: string
  name: string
  status?: string
}

export function CallsTab() {
  const { tenant } = useTenant()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("")
  const [page, setPage] = useState(1)

  // Load all workflows for the dropdown
  const { data: workflowsData, isLoading: workflowsLoading } = useSWR(
    tenant?.voice_api_key ? "/api/calls/workflows" : null,
    fetcher
  )
  const workflows: Workflow[] = workflowsData?.workflows ?? workflowsData?.data ?? []

  // Always fetch org-wide runs (Dograh doesn't support per-workflow filtering easily)
  const queryParams = `?page=${page}&limit=20${selectedWorkflowId ? `&workflow_id=${selectedWorkflowId}` : ""}${filterStatus !== "all" ? `&status=${filterStatus}` : ""}`

  const { data, isLoading } = useSWR(`/api/calls${queryParams}`, fetcher)

  const allRuns: Run[] = data?.runs ?? data?.data ?? []
  // Filter client-side by selected workflow and search
  const filteredByWorkflow = selectedWorkflowId
    ? allRuns.filter(r => String(r.workflow_id) === String(selectedWorkflowId))
    : allRuns
  const runs = search
    ? filteredByWorkflow.filter(r =>
        (r.contact_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (r.phone_number ?? "").includes(search) ||
        (r.run_id ?? "").includes(search)
      )
    : filteredByWorkflow

  const needsConfig = !tenant?.voice_api_key

  if (needsConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-4 border border-[rgba(0,0,0,0.08)]">
          <Phone className="w-6 h-6 text-[#c7c7cc]" />
        </div>
        <h3 className="text-[15px] font-semibold text-[#1d1d1f]">Voice API not configured</h3>
        <p className="text-[13px] text-[#6e6e73] mt-1 max-w-xs">
          Add your Voice API key in Profile &rarr; Integrations to start seeing call runs.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl hairline px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Workflow select dropdown */}
        <div className="relative flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3.5 py-2 min-w-[200px]">
          {workflowsLoading && <Loader2 className="w-3.5 h-3.5 text-[#6e6e73] animate-spin shrink-0" />}
          <select
            value={selectedWorkflowId}
            onChange={e => { setSelectedWorkflowId(e.target.value); setPage(1) }}
            className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-full appearance-none cursor-pointer"
          >
            <option value="">Select workflow…</option>
            {workflows.map(w => (
              <option key={w.workflow_id} value={w.workflow_id}>
                {w.name || w.workflow_id}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#6e6e73] shrink-0 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3.5 py-2">
          <Search className="w-4 h-4 text-[#6e6e73] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search runs…"
            className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-32 placeholder:text-[#6e6e73]"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {["all", "completed", "failed", "no_answer", "in_progress"].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1) }}
              className={cn(
                "text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors",
                filterStatus === s ? "bg-[#0066cc] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0]"
              )}
            >
              {s === "all" ? "All" : s.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        <button className="ml-auto flex items-center gap-1.5 text-[12px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] px-3 py-1.5 rounded-full hover:bg-[#f5f5f7] transition-colors">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {workflowsLoading && (
        <div className="bg-[#f5f5f7] rounded-2xl border border-[rgba(0,0,0,0.08)] px-5 py-3 text-center text-[13px] text-[#6e6e73]">
          Loading your workflows…
        </div>
      )}

      {data?.error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-[13px] text-red-700">{data.error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {[
                    { label: "Run ID", always: true },
                    { label: "Contact", sm: true },
                    { label: "Agent", lg: true },
                    { label: "Status", always: true },
                    { label: "Duration", md: true },
                    { label: "Cost", md: true },
                    { label: "Time", sm: true },
                    { label: "", always: true },
                  ].map((h, i) => (
                    <th key={i} className={cn(
                      "px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider",
                      h.sm && "hidden sm:table-cell",
                      h.lg && "hidden lg:table-cell",
                      h.md && "hidden md:table-cell",
                    )}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-black/[0.04]">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : runs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Phone className="w-8 h-8 text-[#c7c7cc] mx-auto mb-2" />
                      <p className="text-[14px] text-[#6e6e73]">No runs found</p>
                    </td>
                  </tr>
                ) : (
                  runs.map(run => (
                    <RunRow key={run.run_id} run={run} workflowId={selectedWorkflowId} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04]">
            <p className="text-[12px] text-[#6e6e73]">{runs.length} run{runs.length !== 1 ? "s" : ""} shown</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <span className="text-[12px] font-semibold text-[#0066cc] w-7 h-7 rounded-full bg-[#0066cc]/10 flex items-center justify-center">
                {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={allRuns.length < 20}
                className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
    </div>
  )
}
