"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search, PhoneCall, MessageCircle, ExternalLink, AlertCircle, HeadphonesIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface SupportTicket {
  id: number
  order_date?: string
  customer_name?: string
  phone?: string
  email?: string
  issue_type?: string
  issue_description?: string
  status?: string
  resolution?: string
  whatsapp_status?: string
  call_status?: string
  run_id?: string
  recording_url?: string
  transcript_url?: string
  created_at?: string
}

const TICKET_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",        color: "text-dangertext",  bg: "bg-danger/10" },
  in_progress: { label: "In Progress", color: "text-info",  bg: "bg-info/10" },
  resolved:    { label: "Resolved",    color: "text-successtext",  bg: "bg-success/10" },
  closed:      { label: "Closed",      color: "text-mute",  bg: "bg-surface"    },
  pending:     { label: "Pending",     color: "text-warntext",  bg: "bg-warn/10" },
}

const CALL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: "Completed",   color: "text-successtext", bg: "bg-success/10" },
  completed:   { label: "Completed",   color: "text-successtext", bg: "bg-success/10" },
  FAILED:      { label: "Failed",      color: "text-dangertext", bg: "bg-danger/10" },
  IN_PROGRESS: { label: "In Progress", color: "text-info", bg: "bg-info/10" },
}

function DetailPanel({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const S = TICKET_STATUS[(ticket.status ?? "open").toLowerCase()] ?? TICKET_STATUS.open
  const CS = ticket.call_status ? (CALL_STATUS[ticket.call_status] ?? { label: ticket.call_status, color: "text-mute", bg: "bg-surface" }) : null

  return (
    <div className="bg-card rounded-2xl hairline overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink/[0.06]">
        <div>
          <p className="text-[15px] font-semibold text-ink">{ticket.customer_name ?? "Unknown"}</p>
          <p className="text-[12px] text-mute">Ticket #{ticket.id} · {ticket.order_date ? new Date(ticket.order_date).toLocaleDateString("en-IN") : "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>{S.label}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-mute">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Contact */}
        <div>
          <p className="text-[11px] font-semibold text-mute uppercase tracking-wider mb-2">Contact</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Phone", ticket.phone ?? "—"],
              ["Email", ticket.email ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface rounded-xl px-3.5 py-2.5">
                <p className="text-[11px] text-mute">{k}</p>
                <p className="text-[13px] font-medium text-ink truncate">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Issue */}
        <div>
          <p className="text-[11px] font-semibold text-mute uppercase tracking-wider mb-2">Issue</p>
          <div className="bg-surface rounded-xl px-3.5 py-3 mb-2">
            <p className="text-[11px] text-mute mb-1">Type</p>
            <p className="text-[13px] font-medium text-ink">{ticket.issue_type ?? "—"}</p>
          </div>
          {ticket.issue_description && (
            <div className="bg-surface rounded-xl px-3.5 py-3">
              <p className="text-[11px] text-mute mb-1">Description</p>
              <p className="text-[13px] text-ink leading-relaxed">{ticket.issue_description}</p>
            </div>
          )}
        </div>

        {/* Resolution */}
        {ticket.resolution && (
          <div>
            <p className="text-[11px] font-semibold text-mute uppercase tracking-wider mb-2">Resolution</p>
            <div className="bg-success/5 border border-success/20 rounded-xl px-3.5 py-3">
              <p className="text-[13px] text-ink leading-relaxed">{ticket.resolution}</p>
            </div>
          </div>
        )}

        {/* Call details */}
        <div>
          <p className="text-[11px] font-semibold text-mute uppercase tracking-wider mb-2">Call & WhatsApp</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["WA Status", ticket.whatsapp_status ?? "—"],
              ["Call Status", CS?.label ?? "—"],
              ["Run ID", ticket.run_id ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface rounded-xl px-3.5 py-2.5">
                <p className="text-[11px] text-mute">{k}</p>
                <p className="text-[13px] font-medium text-ink truncate font-mono">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-ink/[0.06] flex flex-wrap gap-2">
        {ticket.recording_url && (
          <a href={ticket.recording_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-card hairline text-info text-[13px] font-medium rounded-full px-4 py-2 hover:bg-surface2 transition-colors">
            <PhoneCall className="w-3.5 h-3.5" /> Recording
          </a>
        )}
        {ticket.transcript_url && (
          <a href={ticket.transcript_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-card hairline text-mute text-[13px] font-medium rounded-full px-4 py-2 hover:bg-surface2 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Transcript
          </a>
        )}
        <button className="inline-flex items-center gap-1.5 bg-wa text-white text-[13px] font-medium rounded-full px-4 py-2 active:scale-95 transition-transform">
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </button>
        <button className="inline-flex items-center gap-1.5 bg-info text-white text-[13px] font-medium rounded-full px-4 py-2 active:scale-95 transition-transform">
          <PhoneCall className="w-3.5 h-3.5" /> Call
        </button>
      </div>
    </div>
  )
}

export function CustomerSupportTab() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<SupportTicket | null>(null)

  const { data, isLoading } = useSWR(
    `/api/support?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    fetcher,
    { keepPreviousData: true }
  )

  const tickets: SupportTicket[] = data?.data ?? []
  const total: number = data?.count ?? 0

  return (
    <div className={cn("gap-4", selected ? "grid grid-cols-1 lg:grid-cols-5" : "space-y-4")}>
      {/* Left: table */}
      <div className={cn("space-y-4", selected ? "lg:col-span-3" : "")}>
        {/* Toolbar */}
        <div className="bg-card rounded-2xl hairline px-4 py-3 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-surface rounded-full px-3.5 py-2">
            <Search className="w-4 h-4 text-mute shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search customers, issues…"
              className="bg-transparent text-[13px] text-ink outline-none w-full placeholder:text-mute"
            />
          </div>
          <span className="text-[12px] text-mute shrink-0">{total} tickets</span>
        </div>

        {data?.error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-[13px] text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{data.error}
          </div>
        )}

        <div className="bg-card rounded-2xl hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink/[0.06]">
                  {[
                    { label: "Customer" },
                    { label: "Issue", lg: true },
                    { label: "Status" },
                    { label: "Call", sm: true },
                    { label: "Date", md: true },
                  ].map((h, i) => (
                    <th key={i} className={cn(
                      "px-4 py-3 text-left text-[11px] font-semibold text-mute uppercase tracking-wider",
                      h.lg && "hidden lg:table-cell",
                      h.sm && "hidden sm:table-cell",
                      h.md && "hidden md:table-cell",
                    )}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-ink/[0.04]">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <HeadphonesIcon className="w-8 h-8 text-faint mx-auto mb-3" />
                      <p className="text-[14px] text-mute">No support tickets found</p>
                      <p className="text-[12px] text-faint mt-1">Run the SQL below to create the customer_support table</p>
                    </td>
                  </tr>
                ) : tickets.map(t => {
                  const S = TICKET_STATUS[(t.status ?? "open").toLowerCase()] ?? TICKET_STATUS.open
                  const CS = t.call_status ? (CALL_STATUS[t.call_status] ?? null) : null
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelected(selected?.id === t.id ? null : t)}
                      className={cn(
                        "border-b border-ink/[0.04] hover:bg-surface transition-colors cursor-pointer",
                        selected?.id === t.id && "bg-info/5"
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] font-medium text-ink">{t.customer_name ?? "—"}</p>
                        <p className="text-[11px] text-mute">{t.phone ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-[13px] text-ink truncate max-w-[180px]">{t.issue_type ?? "—"}</p>
                        <p className="text-[11px] text-mute truncate max-w-[180px]">{t.issue_description ?? ""}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>{S.label}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        {CS ? <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", CS.bg, CS.color)}>{CS.label}</span> : <span className="text-[12px] text-faint">—</span>}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-[12px] text-mute">
                          {t.order_date ? new Date(t.order_date).toLocaleDateString("en-IN") : "—"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-ink/[0.04]">
            <p className="text-[12px] text-mute">{total} total</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-surface text-mute hover:bg-hair2 disabled:opacity-40 transition-colors">Prev</button>
              <span className="text-[12px] font-semibold text-info w-7 h-7 rounded-full bg-info/10 flex items-center justify-center">{page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={tickets.length < 20}
                className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-surface text-mute hover:bg-hair2 disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: detail panel */}
      {selected && (
        <div className="lg:col-span-2 h-fit lg:sticky lg:top-0">
          <DetailPanel ticket={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
