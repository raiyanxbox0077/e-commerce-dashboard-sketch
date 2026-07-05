"use client"

import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import {
  Search, Download, PhoneOutgoing, PhoneIncoming,
  ChevronDown, Play, Pause, FileText, Clock, Coins, CheckCircle2,
  XCircle, AlertCircle, Loader2, Phone, X, User, Mic, Bot,
  ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTenant } from "@/hooks/use-tenant"

const fetcher = (url: string) => fetch(url).then(r => r.json())

type CallStatus = "completed" | "failed" | "no_answer" | "in_progress"

interface Run {
  run_id: string
  workflow_id?: string | number
  status: CallStatus
  mode?: string
  phone_number?: string
  contact_name?: string
  agent_name?: string
  duration?: number
  cost?: number
  created_at?: string
  recording_url?: string
  user_recording_url?: string
  bot_recording_url?: string
  transcript_url?: string
  gathered_context?: Record<string, unknown>
  initial_context?: Record<string, unknown>
  summary?: string
}

interface Workflow {
  workflow_id: string
  name: string
  status?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.ElementType }> = {
  completed:   { label: "Completed",   color: "text-[#1a7a32]",  bg: "bg-[#34c759]/10", dot: "bg-[#34c759]",  icon: CheckCircle2 },
  failed:      { label: "Failed",      color: "text-[#cc0000]",  bg: "bg-[#ff3b30]/10", dot: "bg-[#ff3b30]",  icon: XCircle },
  no_answer:   { label: "No Answer",   color: "text-[#8a5900]",  bg: "bg-[#ff9500]/10", dot: "bg-[#ff9500]",  icon: AlertCircle },
  in_progress: { label: "In Progress", color: "text-[#0066cc]",  bg: "bg-[#0066cc]/10", dot: "bg-[#0066cc]",  icon: Loader2 },
}

function formatDuration(sec?: number) {
  if (!sec) return "0s"
  const m = Math.floor(sec / 60), s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ─── Audio Player ────────────────────────────────────────────────────────────
function AudioPlayer({ src, label }: { src: string; label: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrent] = useState(0)
  const [error, setError] = useState(false)

  // Don't render anything if src is empty — prevents NotSupportedError
  if (!src || !src.trim()) return null

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().catch(() => setError(true)); setPlaying(true) }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Number(e.target.value)
    setCurrent(Number(e.target.value))
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="bg-[#f5f5f7] rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-[#0066cc]/10 flex items-center justify-center shrink-0">
          <Mic className="w-3 h-3 text-[#0066cc]" />
        </div>
        <span className="text-[12px] font-medium text-[#1d1d1f] flex-1">{label}</span>
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-[#0066cc] hover:underline font-medium"
          onClick={e => e.stopPropagation()}
        >
          <Download className="w-3 h-3" /> Download
        </a>
      </div>
      {error ? (
        <p className="text-[12px] text-[#6e6e73]">Unable to play — use the download link above.</p>
      ) : (
        <>
          {/* Only set src when we have a valid URL — prevents NotSupportedError */}
          <audio
            ref={audioRef}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
            onTimeUpdate={() => {
              const a = audioRef.current
              if (!a) return
              setCurrent(a.currentTime)
            }}
            onEnded={() => setPlaying(false)}
            onError={() => setError(true)}
            className="hidden"
            preload="none"
          >
            <source src={src} />
          </audio>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-8 h-8 rounded-full bg-[#0066cc] flex items-center justify-center shrink-0 hover:bg-[#0055b3] transition-colors"
            >
              {playing
                ? <Pause className="w-3.5 h-3.5 text-white fill-white" />
                : <Play className="w-3.5 h-3.5 text-white fill-white" />}
            </button>
            <input
              type="range" min={0} max={duration || 1} step={0.1}
              value={currentTime}
              onChange={seek}
              className="flex-1 h-1.5 accent-[#0066cc] cursor-pointer"
            />
            <span className="text-[11px] text-[#6e6e73] font-mono shrink-0 w-16 text-right">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Run Detail Panel ────────────────────────────────────────────────────────
function RunDetailPanel({
  run,
  workflowId,
  onClose,
}: { run: Run; workflowId: string; onClose: () => void }) {
  const { data: detail, isLoading } = useSWR(
    run.run_id ? `/api/calls/${run.run_id}` : null,
    fetcher
  )

  // Merge detail over list run — if detail fetch failed, keep list data
  const detailOk = detail && !detail.error
  const d: Run = { ...run, ...(detailOk ? detail : {}) }
  const S = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.failed
  const SIcon = S.icon

  const recordings = [
    d.recording_url && { src: d.recording_url, label: "Full Recording" },
    d.user_recording_url && { src: d.user_recording_url, label: "Customer Recording" },
    d.bot_recording_url && { src: d.bot_recording_url, label: "Bot Recording" },
  ].filter(Boolean) as { src: string; label: string }[]

  const ctx = d.gathered_context && Object.keys(d.gathered_context).length > 0 ? d.gathered_context : null
  const initCtx = d.initial_context && Object.keys(d.initial_context).length > 0 ? d.initial_context : null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] shrink-0">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            d.mode !== "inbound" ? "bg-[#0066cc]/10" : "bg-[#34c759]/10"
          )}>
            {d.mode !== "inbound"
              ? <PhoneOutgoing className="w-4 h-4 text-[#0066cc]" />
              : <PhoneIncoming className="w-4 h-4 text-[#34c759]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-[#1d1d1f] truncate">
              {d.contact_name && d.contact_name !== "—" ? d.contact_name : (d.phone_number ?? "Unknown")}
            </p>
            <p className="text-[12px] text-[#6e6e73]">Run #{d.run_id}</p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", S.bg, S.color)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", S.dot)} />
            {S.label}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#6e6e73] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-[13px] text-[#6e6e73] bg-[#f5f5f7] rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading run details…
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Clock, label: "Duration", value: formatDuration(d.duration) },
              { icon: Coins, label: "Tokens", value: d.cost !== undefined ? String(d.cost) : "—" },
              { icon: Phone, label: "Phone", value: d.phone_number ?? "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#f5f5f7] rounded-xl px-3 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-[#6e6e73]" />
                  <span className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-[14px] font-semibold text-[#1d1d1f] truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Agent + time */}
          <div className="bg-[#f5f5f7] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#0066cc]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#6e6e73]">Agent / Workflow</p>
              <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{d.agent_name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] text-[#6e6e73]">Time</p>
              <p className="text-[12px] font-medium text-[#1d1d1f]">
                {d.created_at ? new Date(d.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}
              </p>
            </div>
          </div>

          {/* Summary */}
          {d.summary && (
            <div className="bg-[#f5f5f7] rounded-xl px-4 py-3">
              <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-1.5">Summary</p>
              <p className="text-[13px] text-[#1d1d1f] leading-relaxed">{d.summary}</p>
            </div>
          )}

          {/* Recordings */}
          <div>
            <p className="text-[12px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Recordings</p>
            {recordings.length > 0 ? (
              <div className="space-y-2">
                {recordings.map(r => (
                  <AudioPlayer key={r.src} src={r.src} label={r.label} />
                ))}
              </div>
            ) : (
              <div className="bg-[#f5f5f7] rounded-xl px-4 py-3 text-[13px] text-[#6e6e73]">
                {isLoading ? "Loading…" : "No recordings available"}
              </div>
            )}
          </div>

          {/* Transcript */}
          <div>
            <p className="text-[12px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Transcript</p>
            {d.transcript_url ? (
              <div className="flex items-center gap-2">
                <a
                  href={d.transcript_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center gap-2.5 bg-[#f5f5f7] hover:bg-[#ebebf0] rounded-xl px-4 py-3 transition-colors"
                >
                  <FileText className="w-4 h-4 text-[#0066cc]" />
                  <span className="text-[13px] font-medium text-[#0066cc] flex-1">View Transcript</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#6e6e73]" />
                </a>
                <a
                  href={d.transcript_url}
                  download
                  className="flex items-center gap-1.5 bg-[#f5f5f7] hover:bg-[#ebebf0] rounded-xl px-3 py-3 text-[12px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            ) : (
              <div className="bg-[#f5f5f7] rounded-xl px-4 py-3 text-[13px] text-[#6e6e73]">
                {isLoading ? "Loading…" : "No transcript available"}
              </div>
            )}
          </div>

          {/* Gathered context */}
          {ctx && (
            <div>
              <p className="text-[12px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Gathered Context</p>
              <div className="bg-[#f5f5f7] rounded-xl px-4 py-3 space-y-2">
                {Object.entries(ctx).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 text-[13px]">
                    <span className="text-[#6e6e73] capitalize">{k.replace(/_/g, " ")}</span>
                    <span className="font-medium text-[#1d1d1f] text-right">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Initial context */}
          {initCtx && (
            <div>
              <p className="text-[12px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Initial Context</p>
              <div className="bg-[#f5f5f7] rounded-xl px-4 py-3 space-y-2">
                {Object.entries(initCtx).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 text-[13px]">
                    <span className="text-[#6e6e73] capitalize">{k.replace(/_/g, " ")}</span>
                    <span className="font-medium text-[#1d1d1f] text-right">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function CallsTab() {
  const { tenant } = useTenant()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("")
  const [page, setPage] = useState(1)
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)

  // Load workflows for dropdown
  const { data: workflowsData, isLoading: workflowsLoading } = useSWR(
    tenant?.voice_api_key ? "/api/calls/workflows" : null,
    fetcher
  )
  const workflows: Workflow[] = workflowsData?.workflows ?? []

  // Fetch runs
  const queryParams = `?page=${page}&limit=20${selectedWorkflowId ? `&workflow_id=${selectedWorkflowId}` : ""}${filterStatus !== "all" ? `&status=${filterStatus}` : ""}`
  const { data, isLoading } = useSWR(
    tenant?.voice_api_key ? `/api/calls${queryParams}` : null,
    fetcher
  )

  const allRuns: Run[] = data?.runs ?? []
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

  // Close panel on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setSelectedRun(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!tenant?.voice_api_key) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-4 border border-[rgba(0,0,0,0.08)]">
          <Phone className="w-6 h-6 text-[#c7c7cc]" />
        </div>
        <h3 className="text-[15px] font-semibold text-[#1d1d1f]">Voice API not configured</h3>
        <p className="text-[13px] text-[#6e6e73] mt-1 max-w-xs">
          Add your Voice API key in Profile &rarr; Integrations to see call runs.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="bg-white rounded-2xl hairline px-4 py-3 flex flex-wrap items-center gap-3">
          {/* Workflow dropdown */}
          <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3.5 py-2 min-w-[180px]">
            {workflowsLoading
              ? <Loader2 className="w-3.5 h-3.5 text-[#6e6e73] animate-spin shrink-0" />
              : <Bot className="w-3.5 h-3.5 text-[#6e6e73] shrink-0" />}
            <select
              value={selectedWorkflowId}
              onChange={e => { setSelectedWorkflowId(e.target.value); setPage(1) }}
              className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-full appearance-none cursor-pointer"
            >
              <option key="__all__" value="">All workflows</option>
              {workflows.map((w, i) => (
                <option key={w.workflow_id ?? i} value={w.workflow_id}>
                  {w.name || w.workflow_id}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6e6e73] shrink-0 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3.5 py-2">
            <Search className="w-3.5 h-3.5 text-[#6e6e73] shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-28 placeholder:text-[#6e6e73]"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {(["all", "completed", "failed", "no_answer"] as const).map(s => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setPage(1) }}
                className={cn(
                  "text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors capitalize",
                  filterStatus === s
                    ? "bg-[#0066cc] text-white"
                    : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0]"
                )}
              >
                {s === "all" ? "All" : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {data?.error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-[13px] text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {data.error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {[
                    { label: "Contact", cls: "" },
                    { label: "Agent", cls: "hidden lg:table-cell" },
                    { label: "Status", cls: "" },
                    { label: "Duration", cls: "hidden md:table-cell" },
                    { label: "Tokens", cls: "hidden md:table-cell" },
                    { label: "Time", cls: "hidden sm:table-cell" },
                    { label: "Media", cls: "hidden sm:table-cell" },
                    { label: "", cls: "" },
                  ].map((h, i) => (
                    <th key={i} className={cn("px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider", h.cls)}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
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
                    <td colSpan={8} className="px-4 py-14 text-center">
                      <Phone className="w-8 h-8 text-[#c7c7cc] mx-auto mb-2" />
                      <p className="text-[14px] font-medium text-[#6e6e73]">No runs found</p>
                    </td>
                  </tr>
                ) : (
                  runs.map(run => {
                    const S = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.failed
                    const SIcon = S.icon
                    const hasMedia = !!(run.recording_url || run.transcript_url)
                    return (
                      <tr
                        key={run.run_id}
                        onClick={() => setSelectedRun(run)}
                        className="border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-[#6e6e73]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#1d1d1f] truncate">
                                {run.contact_name && run.contact_name !== "—" ? run.contact_name : (run.phone_number ?? "Unknown")}
                              </p>
                              {run.phone_number && run.contact_name !== "—" && (
                                <p className="text-[11px] text-[#6e6e73]">{run.phone_number}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <p className="text-[13px] text-[#1d1d1f] truncate max-w-[160px]">{run.agent_name ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", S.dot)} />
                            <span className="hidden sm:inline">{S.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-[13px] text-[#1d1d1f]">{formatDuration(run.duration)}</span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-[13px] text-[#1d1d1f]">
                            {run.cost !== undefined ? run.cost : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className="text-[12px] text-[#6e6e73]">
                            {run.created_at ? new Date(run.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            {run.recording_url && (
                              <span className="w-6 h-6 rounded-md bg-[#0066cc]/10 flex items-center justify-center" title="Has recording">
                                <Mic className="w-3 h-3 text-[#0066cc]" />
                              </span>
                            )}
                            {run.transcript_url && (
                              <span className="w-6 h-6 rounded-md bg-[#34c759]/10 flex items-center justify-center" title="Has transcript">
                                <FileText className="w-3 h-3 text-[#34c759]" />
                              </span>
                            )}
                            {!hasMedia && <span className="text-[11px] text-[#c7c7cc]">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04]">
            <p className="text-[12px] text-[#6e6e73]">{runs.length} run{runs.length !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-[12px] font-semibold text-[#0066cc] w-7 h-7 rounded-full bg-[#0066cc]/10 flex items-center justify-center">
                {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={allRuns.length < 20}
                className="flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out detail panel */}
      {selectedRun && (
        <RunDetailPanel
          run={selectedRun}
          workflowId={selectedRun.workflow_id ? String(selectedRun.workflow_id) : selectedWorkflowId}
          onClose={() => setSelectedRun(null)}
        />
      )}
    </>
  )
}
