"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search, PhoneCall, MessageCircle, ExternalLink, AlertCircle, Star, X } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Review {
  id: number
  order_date?: string
  customer_name?: string
  phone?: string
  email?: string
  order_id?: string
  product_name?: string
  rating?: number
  review_text?: string
  sentiment?: string
  status?: string
  whatsapp_status?: string
  call_status?: string
  run_id?: string
  recording_url?: string
  transcript_url?: string
  created_at?: string
}

const SENTIMENT: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: "Positive", color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  neutral:  { label: "Neutral",  color: "text-[#8a5900]", bg: "bg-[#ff9500]/10" },
  negative: { label: "Negative", color: "text-[#cc0000]", bg: "bg-[#ff3b30]/10" },
}

const CALL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: "Completed",   color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  completed:   { label: "Completed",   color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  FAILED:      { label: "Failed",      color: "text-[#cc0000]", bg: "bg-[#ff3b30]/10" },
  IN_PROGRESS: { label: "In Progress", color: "text-[#0066cc]", bg: "bg-[#0066cc]/10" },
}

function StarRating({ rating }: { rating?: number }) {
  const n = Math.round(rating ?? 0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("w-3.5 h-3.5", i <= n ? "text-[#ff9500] fill-[#ff9500]" : "text-[#c7c7cc]")} />
      ))}
    </div>
  )
}

function DetailPanel({ review, onClose }: { review: Review; onClose: () => void }) {
  const sent = SENTIMENT[(review.sentiment ?? "").toLowerCase()]
  const CS = review.call_status ? (CALL_STATUS[review.call_status] ?? { label: review.call_status, color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" }) : null

  return (
    <div className="bg-white rounded-2xl hairline overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
        <div>
          <p className="text-[15px] font-semibold text-[#1d1d1f]">{review.customer_name ?? "Unknown"}</p>
          <p className="text-[12px] text-[#6e6e73]">Review #{review.id} · {review.order_date ? new Date(review.order_date).toLocaleDateString("en-IN") : "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          {sent && <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", sent.bg, sent.color)}>{sent.label}</span>}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#6e6e73]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Rating */}
        <div>
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Rating</p>
          <div className="flex items-center gap-3 bg-[#f5f5f7] rounded-xl px-4 py-3">
            <StarRating rating={review.rating} />
            <span className="text-[15px] font-semibold text-[#1d1d1f]">{review.rating ?? "—"}/5</span>
          </div>
        </div>

        {/* Review text */}
        {review.review_text && (
          <div>
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Review</p>
            <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-3">
              <p className="text-[13px] text-[#1d1d1f] leading-relaxed">{review.review_text}</p>
            </div>
          </div>
        )}

        {/* Product + Order */}
        <div>
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Order</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Order ID", review.order_id ?? "—"],
              ["Product", review.product_name ?? "—"],
              ["Phone", review.phone ?? "—"],
              ["Email", review.email ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#f5f5f7] rounded-xl px-3.5 py-2.5">
                <p className="text-[11px] text-[#6e6e73]">{k}</p>
                <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call details */}
        <div>
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Call & WhatsApp</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["WA Status", review.whatsapp_status ?? "—"],
              ["Call Status", CS?.label ?? "—"],
              ["Run ID", review.run_id ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#f5f5f7] rounded-xl px-3.5 py-2.5">
                <p className="text-[11px] text-[#6e6e73]">{k}</p>
                <p className="text-[13px] font-medium text-[#1d1d1f] truncate font-mono">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-black/[0.06] flex flex-wrap gap-2">
        {review.recording_url && (
          <a href={review.recording_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-white hairline text-[#0066cc] text-[13px] font-medium rounded-full px-4 py-2 hover:bg-[#f0f0f5] transition-colors">
            <PhoneCall className="w-3.5 h-3.5" /> Recording
          </a>
        )}
        {review.transcript_url && (
          <a href={review.transcript_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-white hairline text-[#6e6e73] text-[13px] font-medium rounded-full px-4 py-2 hover:bg-[#f0f0f5] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Transcript
          </a>
        )}
        <button className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-[13px] font-medium rounded-full px-4 py-2 active:scale-95 transition-transform">
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </button>
        <button className="inline-flex items-center gap-1.5 bg-[#0066cc] text-white text-[13px] font-medium rounded-full px-4 py-2 active:scale-95 transition-transform">
          <PhoneCall className="w-3.5 h-3.5" /> Call
        </button>
      </div>
    </div>
  )
}

export function CustomerReviewTab() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Review | null>(null)

  const { data, isLoading } = useSWR(
    `/api/reviews?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    fetcher,
    { keepPreviousData: true }
  )

  const reviews: Review[] = data?.data ?? []
  const total: number = data?.count ?? 0

  return (
    <div className={cn("gap-4", selected ? "grid grid-cols-1 lg:grid-cols-5" : "space-y-4")}>
      {/* Left: table */}
      <div className={cn("space-y-4", selected ? "lg:col-span-3" : "")}>
        {/* Toolbar */}
        <div className="bg-white rounded-2xl hairline px-4 py-3 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3.5 py-2">
            <Search className="w-4 h-4 text-[#6e6e73] shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search customers, reviews…"
              className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-full placeholder:text-[#6e6e73]"
            />
          </div>
          <span className="text-[12px] text-[#6e6e73] shrink-0">{total} reviews</span>
        </div>

        {data?.error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-[13px] text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{data.error}
          </div>
        )}

        <div className="bg-white rounded-2xl hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {[
                    { label: "Customer" },
                    { label: "Rating" },
                    { label: "Product", lg: true },
                    { label: "Sentiment", sm: true },
                    { label: "Call", md: true },
                    { label: "Date", md: true },
                  ].map((h, i) => (
                    <th key={i} className={cn(
                      "px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider",
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
                    <tr key={i} className="border-b border-black/[0.04]">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Star className="w-8 h-8 text-[#c7c7cc] mx-auto mb-3" />
                      <p className="text-[14px] text-[#6e6e73]">No reviews found</p>
                      <p className="text-[12px] text-[#c7c7cc] mt-1">Run the SQL below to create the customer_review table</p>
                    </td>
                  </tr>
                ) : reviews.map(r => {
                  const sent = SENTIMENT[(r.sentiment ?? "").toLowerCase()]
                  const CS = r.call_status ? (CALL_STATUS[r.call_status] ?? null) : null
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(selected?.id === r.id ? null : r)}
                      className={cn(
                        "border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer",
                        selected?.id === r.id && "bg-[#0066cc]/5"
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] font-medium text-[#1d1d1f]">{r.customer_name ?? "—"}</p>
                        <p className="text-[11px] text-[#6e6e73]">{r.phone ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StarRating rating={r.rating} />
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-[13px] text-[#1d1d1f] truncate max-w-[160px]">{r.product_name ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        {sent
                          ? <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", sent.bg, sent.color)}>{sent.label}</span>
                          : <span className="text-[12px] text-[#c7c7cc]">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {CS
                          ? <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", CS.bg, CS.color)}>{CS.label}</span>
                          : <span className="text-[12px] text-[#c7c7cc]">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-[12px] text-[#6e6e73]">
                          {r.order_date ? new Date(r.order_date).toLocaleDateString("en-IN") : "—"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04]">
            <p className="text-[12px] text-[#6e6e73]">{total} total</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors">Prev</button>
              <span className="text-[12px] font-semibold text-[#0066cc] w-7 h-7 rounded-full bg-[#0066cc]/10 flex items-center justify-center">{page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={reviews.length < 20}
                className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: detail panel */}
      {selected && (
        <div className="lg:col-span-2 h-fit lg:sticky lg:top-0">
          <DetailPanel review={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
