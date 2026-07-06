"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Search, ExternalLink, PhoneCall,
  ShoppingBag, AlertCircle, X, Star, ChevronRight, Loader2,
  PhoneOutgoing,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTenant } from "@/hooks/use-tenant"

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── Run Mini Panel (fetches call detail for a RUN_ID inline) ────────────────

interface RunMiniPanelProps { runId: string; onClose: () => void }

function RunMiniPanel({ runId, onClose }: RunMiniPanelProps) {
  const { data, isLoading } = useSWR(`/api/calls/${runId}`, fetcher)
  const d = data && !data.error ? data : null

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    completed:   { label: "Completed",   color: "text-[#1a7a32]",  bg: "bg-[#34c759]/10" },
    failed:      { label: "Failed",      color: "text-[#cc0000]",  bg: "bg-[#ff3b30]/10" },
    no_answer:   { label: "No Answer",   color: "text-[#8a5900]",  bg: "bg-[#ff9500]/10" },
    in_progress: { label: "In Progress", color: "text-[#0066cc]",  bg: "bg-[#0066cc]/10" },
  }

  const S = d?.status ? (STATUS_CFG[d.status] ?? STATUS_CFG.failed) : null

  return (
    <div className="mt-3 bg-[#f5f5f7] rounded-xl overflow-hidden border border-black/[0.06]">
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border-b border-black/[0.06]">
        <PhoneOutgoing className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
        <p className="text-[12px] font-semibold text-[#1d1d1f] flex-1 font-mono truncate">{runId}</p>
        {S && <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", S.bg, S.color)}>{S.label}</span>}
        <button onClick={onClose} className="p-1 rounded-md hover:bg-[#f5f5f7] text-[#6e6e73]">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="px-3.5 py-3 space-y-2">
        {isLoading && (
          <div className="flex items-center gap-2 text-[12px] text-[#6e6e73]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading call details…
          </div>
        )}
        {data?.error && <p className="text-[12px] text-[#cc0000]">Could not load: {data.error}</p>}
        {d && (
          <div className="space-y-1.5">
            {[
              ["Phone",    d.phone_number ?? "—"],
              ["Agent",    d.agent_name   ?? "—"],
              ["Duration", d.duration ? `${Math.floor(d.duration / 60)}m ${d.duration % 60}s` : "—"],
              ["Time",     d.created_at ? new Date(d.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-[12px]">
                <span className="text-[#6e6e73]">{k}</span>
                <span className="font-medium text-[#1d1d1f] truncate text-right max-w-[60%]">{v}</span>
              </div>
            ))}
            {d.summary && (
              <div className="mt-2 pt-2 border-t border-black/[0.06]">
                <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-1">Summary</p>
                <p className="text-[12px] text-[#1d1d1f] leading-relaxed">{d.summary}</p>
              </div>
            )}
            {d.recording_url && (
              <a href={d.recording_url} target="_blank" rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] text-[#0066cc] hover:underline">
                <PhoneCall className="w-3 h-3" /> Listen to recording
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

const CALL_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
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

// ─── COD ────────────────────────────────────────────────────────────────────

interface CodOrder {
  "order id"?: number
  order_number?: string
  confirmation_number?: string
  order_date?: string
  payment_method?: string
  customer_name?: string
  phone?: string
  email?: string
  product_name?: string
  variant?: string
  sku?: string
  quantity?: string
  product_price?: number
  total_amount?: number
  shipping_charge?: number
  tax?: number
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  pincode?: number
  "order confirm"?: string
  "follow up"?: string
  status?: string
  "WhatsApp Status"?: string
  Recording_url?: string
  RUN_ID?: string
  transcript_url?: string
}

const SAMPLE_COD: CodOrder = {
  "order id": 1001,
  order_number: "#1001",
  confirmation_number: "CONF-8821",
  order_date: new Date().toISOString(),
  payment_method: "Cash on Delivery",
  customer_name: "Ravi Kumar",
  phone: "+91 98765 43210",
  email: "ravi@example.com",
  product_name: "Premium Wireless Earbuds",
  variant: "Black",
  sku: "SKU-WE-001",
  quantity: "1",
  product_price: 1499,
  total_amount: 1599,
  shipping_charge: 100,
  tax: 0,
  address_line1: "12, MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: 560001,
  status: "confirmed",
  RUN_ID: "run_sample_001",
}

const COD_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  completed:  { label: "Completed",  color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  confirmed:  { label: "Confirmed",  color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  rejected:   { label: "Rejected",   color: "text-[#cc0000]", bg: "bg-[#ff3b30]/10" },
  pending:    { label: "Pending",    color: "text-[#8a5900]", bg: "bg-[#ff9500]/10" },
  no_answer:  { label: "No Answer",  color: "text-[#8a5900]", bg: "bg-[#ff9500]/10" },
}

function CodDetailPanel({ order, onClose }: { order: CodOrder; onClose: () => void }) {
  const [expandedRun, setExpandedRun] = useState(false)
  const statusKey = (order.status ?? "pending").toLowerCase()
  const S = COD_STATUS[statusKey] ?? { label: order.status ?? "—", color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" }
  const orderId = order.order_number ?? `#${order["order id"] ?? "—"}`

  return (
    <div className="bg-white rounded-2xl hairline overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
        <div>
          <p className="text-[15px] font-semibold text-[#1d1d1f]">{orderId}</p>
          <p className="text-[12px] text-[#6e6e73]">{order.customer_name ?? "—"} · {order.order_date ? new Date(order.order_date).toLocaleDateString("en-IN") : "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>{S.label}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#6e6e73]"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="overflow-y-auto px-5 py-4 space-y-4 max-h-[70vh]">
        <Section label="Customer">
          <Grid2 items={[["Phone", order.phone ?? "—"], ["Email", order.email ?? "—"]]} />
        </Section>
        <Section label="Order Details">
          <Grid2 items={[
            ["Confirmation", order.confirmation_number ?? "—"],
            ["Payment", order.payment_method ?? "—"],
            ["SKU", order.sku ?? "—"],
            ["Variant", order.variant ?? "—"],
            ["Qty", order.quantity ?? "—"],
            ["Unit Price", order.product_price ? `₹${order.product_price}` : "—"],
            ["Shipping", order.shipping_charge ? `₹${order.shipping_charge}` : "—"],
            ["Tax", order.tax ? `₹${order.tax}` : "—"],
          ]} />
        </Section>
        <Section label="Delivery">
          <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-3 text-[13px] text-[#1d1d1f]">
            {[order.address_line1, order.address_line2, order.city, order.state, order.pincode].filter(Boolean).join(", ") || "—"}
          </div>
        </Section>
        {order.RUN_ID && (
          <Section label="Workflow Run">
            <button
              onClick={() => setExpandedRun(v => !v)}
              className="flex items-center gap-2 w-full bg-[#f5f5f7] hover:bg-[#ebebf0] rounded-xl px-3.5 py-2.5 transition-colors text-left"
            >
              <PhoneOutgoing className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
              <code className="text-[12px] font-mono text-[#0066cc] flex-1 truncate">{order.RUN_ID}</code>
              <ChevronRight className={cn("w-3.5 h-3.5 text-[#6e6e73] shrink-0 transition-transform", expandedRun && "rotate-90")} />
            </button>
            {expandedRun && <RunMiniPanel runId={order.RUN_ID} onClose={() => setExpandedRun(false)} />}
          </Section>
        )}
      </div>
      <div className="px-5 py-4 border-t border-black/[0.06] flex flex-wrap gap-2">
        {order.Recording_url && (
          <a href={order.Recording_url} target="_blank" rel="noreferrer" className="action-link-blue">
            <PhoneCall className="w-3.5 h-3.5" /> Recording
          </a>
        )}
        {order.transcript_url && (
          <a href={order.transcript_url} target="_blank" rel="noreferrer" className="action-link-gray">
            <ExternalLink className="w-3.5 h-3.5" /> Transcript
          </a>
        )}
      </div>
    </div>
  )
}

function CodRow({ order, selected, onSelect }: { order: CodOrder; selected: boolean; onSelect: () => void }) {
  const statusKey = (order.status ?? "pending").toLowerCase()
  const S = COD_STATUS[statusKey] ?? { label: order.status ?? "—", color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" }
  const orderId = order.order_number ?? `#${order["order id"] ?? "—"}`
  return (
    <tr className={cn("border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer", selected && "bg-[#0066cc]/5")} onClick={onSelect}>
      <td className="px-4 py-3.5">
        <p className="text-[13px] font-semibold text-[#1d1d1f]">{orderId}</p>
        <p className="text-[11px] text-[#6e6e73]">{order.order_date ? new Date(order.order_date).toLocaleDateString("en-IN") : "—"}</p>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <p className="text-[13px] font-medium text-[#1d1d1f]">{order.customer_name ?? "—"}</p>
        <p className="text-[11px] text-[#6e6e73]">{order.phone ?? "—"}</p>
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <p className="text-[13px] text-[#1d1d1f] truncate max-w-[180px]">{order.product_name ?? "—"}</p>
        <p className="text-[11px] text-[#6e6e73]">{order.city ?? "—"}</p>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-[14px] font-semibold text-[#1d1d1f]">₹{(order.total_amount ?? 0).toLocaleString("en-IN")}</p>
      </td>
      <td className="px-4 py-3.5">
        <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>{S.label}</span>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <code className="text-[11px] font-mono text-[#6e6e73]">{order.RUN_ID ?? "—"}</code>
      </td>
    </tr>
  )
}

// ─── Cart ────────────────────────────────────────────────────────────────────

interface CartItem {
  "checkout id"?: number
  checkout_token?: string
  order_date?: string
  customer_name?: string
  phone?: string
  email?: string
  product_name?: string
  variant?: string
  sku?: string
  quantity?: string
  product_price?: number
  total_amount?: number
  shipping_charge?: number
  tax?: number
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  pincode?: number
  abandoned_checkout_url?: string
  "call status"?: string
  "WhatsApp Status"?: string
  RUN_ID?: string | null
}

const SAMPLE_CART: CartItem = {
  "checkout id": 2001,
  checkout_token: "token_abc123",
  order_date: new Date().toISOString(),
  customer_name: "Priya Sharma",
  phone: "+91 91234 56789",
  email: "priya@example.com",
  product_name: "Yoga Mat Pro",
  variant: "Purple, 6mm",
  sku: "SKU-YM-002",
  quantity: "2",
  product_price: 899,
  total_amount: 1798,
  shipping_charge: 0,
  city: "Mumbai",
  state: "Maharashtra",
  pincode: 400001,
  "call status": "COMPLETED",
  "WhatsApp Status": "sent",
  abandoned_checkout_url: "#",
}

function CartDetailPanel({ row, onClose }: { row: CartItem; onClose: () => void }) {
  const [expandedRun, setExpandedRun] = useState(false)
  const callSt = row["call status"] ?? ""
  const CS = CALL_STATUS_MAP[callSt] ?? (callSt ? { label: callSt, color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" } : null)
  return (
    <div className="bg-white rounded-2xl hairline overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
        <div>
          <p className="text-[15px] font-semibold text-[#1d1d1f]">{row.customer_name ?? "—"}</p>
          <p className="text-[12px] text-[#6e6e73]">{row.phone ?? "—"} · {row.order_date ? new Date(row.order_date).toLocaleDateString("en-IN") : "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          {CS && <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", CS.bg, CS.color)}>{CS.label}</span>}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#6e6e73]"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="overflow-y-auto px-5 py-4 space-y-4 max-h-[70vh]">
        <Section label="Product">
          <Grid2 items={[
            ["Product", row.product_name ?? "—"],
            ["Variant", row.variant ?? "—"],
            ["SKU", row.sku ?? "—"],
            ["Qty", row.quantity ?? "—"],
            ["Unit Price", row.product_price ? `₹${row.product_price}` : "—"],
            ["Shipping", row.shipping_charge ? `₹${row.shipping_charge}` : "Free"],
            ["Tax", row.tax ? `₹${row.tax}` : "—"],
            ["Email", row.email ?? "—"],
          ]} />
        </Section>
        <Section label="Delivery">
          <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-3 text-[13px] text-[#1d1d1f]">
            {[row.address_line1, row.address_line2, row.city, row.state, row.pincode].filter(Boolean).join(", ") || "—"}
          </div>
        </Section>
        <Section label="WhatsApp">
          <Grid2 items={[["Status", row["WhatsApp Status"] ?? "—"]]} />
        </Section>
        {row.RUN_ID && (
          <Section label="Workflow Run">
            <button
              onClick={() => setExpandedRun(v => !v)}
              className="flex items-center gap-2 w-full bg-[#f5f5f7] hover:bg-[#ebebf0] rounded-xl px-3.5 py-2.5 transition-colors text-left"
            >
              <PhoneOutgoing className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
              <code className="text-[12px] font-mono text-[#0066cc] flex-1 truncate">{row.RUN_ID}</code>
              <ChevronRight className={cn("w-3.5 h-3.5 text-[#6e6e73] shrink-0 transition-transform", expandedRun && "rotate-90")} />
            </button>
            {expandedRun && <RunMiniPanel runId={row.RUN_ID} onClose={() => setExpandedRun(false)} />}
          </Section>
        )}
      </div>
      <div className="px-5 py-4 border-t border-black/[0.06] flex flex-wrap gap-2">
        {row.abandoned_checkout_url && (
          <a href={row.abandoned_checkout_url} target="_blank" rel="noreferrer" className="action-link-blue">
            <ExternalLink className="w-3.5 h-3.5" /> Open Checkout
          </a>
        )}
      </div>
    </div>
  )
}

function CartRow({ row, selected, onSelect }: { row: CartItem; selected: boolean; onSelect: () => void }) {
  const callSt = row["call status"] ?? ""
  const CS = CALL_STATUS_MAP[callSt] ?? (callSt ? { label: callSt, color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" } : null)
  return (
    <tr className={cn("border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer", selected && "bg-[#0066cc]/5")} onClick={onSelect}>
      <td className="px-4 py-3.5">
        <p className="text-[13px] font-medium text-[#1d1d1f]">{row.customer_name ?? "—"}</p>
        <p className="text-[11px] text-[#6e6e73]">{row.phone ?? "—"}</p>
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <p className="text-[13px] text-[#1d1d1f] truncate max-w-[180px]">{row.product_name ?? "—"}</p>
        <p className="text-[11px] text-[#6e6e73]">{row.variant ?? "—"}</p>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-[14px] font-semibold text-[#1d1d1f]">₹{(row.total_amount ?? 0).toLocaleString("en-IN")}</p>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <span className="text-[12px] text-[#6e6e73]">{row.order_date ? new Date(row.order_date).toLocaleDateString("en-IN") : "—"}</span>
      </td>
      <td className="px-4 py-3.5">
        {CS && <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", CS.bg, CS.color)}>{CS.label}</span>}
      </td>
    </tr>
  )
}

// ─── Customer Support ────────────────────────────────────────────────────────

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
}

const SAMPLE_SUPPORT: SupportTicket = {
  id: 3001,
  order_date: new Date().toISOString(),
  customer_name: "Amit Patel",
  phone: "+91 88001 23456",
  email: "amit@example.com",
  issue_type: "Wrong Item Delivered",
  issue_description: "Customer received a red variant instead of the blue one ordered. Requesting exchange or refund.",
  status: "in_progress",
  whatsapp_status: "sent",
  call_status: "COMPLETED",
  run_id: "run_support_001",
  resolution: "Exchange initiated. Replacement dispatched within 2 business days.",
}

const TICKET_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",        color: "text-[#cc0000]",  bg: "bg-[#ff3b30]/10" },
  in_progress: { label: "In Progress", color: "text-[#0066cc]",  bg: "bg-[#0066cc]/10" },
  resolved:    { label: "Resolved",    color: "text-[#1a7a32]",  bg: "bg-[#34c759]/10" },
  closed:      { label: "Closed",      color: "text-[#6e6e73]",  bg: "bg-[#f5f5f7]"    },
  pending:     { label: "Pending",     color: "text-[#8a5900]",  bg: "bg-[#ff9500]/10" },
}

function SupportDetailPanel({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const S = TICKET_STATUS[(ticket.status ?? "open").toLowerCase()] ?? TICKET_STATUS.open
  const CS = ticket.call_status ? (CALL_STATUS_MAP[ticket.call_status] ?? { label: ticket.call_status, color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" }) : null
  return (
    <div className="bg-white rounded-2xl hairline overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
        <div>
          <p className="text-[15px] font-semibold text-[#1d1d1f]">{ticket.customer_name ?? "Unknown"}</p>
          <p className="text-[12px] text-[#6e6e73]">Ticket #{ticket.id} · {ticket.order_date ? new Date(ticket.order_date).toLocaleDateString("en-IN") : "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>{S.label}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#6e6e73]"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="overflow-y-auto px-5 py-4 space-y-4 max-h-[70vh]">
        <Section label="Contact">
          <Grid2 items={[["Phone", ticket.phone ?? "—"], ["Email", ticket.email ?? "—"]]} />
        </Section>
        <Section label="Issue">
          <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-3 mb-2">
            <p className="text-[11px] text-[#6e6e73] mb-1">Type</p>
            <p className="text-[13px] font-medium text-[#1d1d1f]">{ticket.issue_type ?? "—"}</p>
          </div>
          {ticket.issue_description && (
            <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-3">
              <p className="text-[11px] text-[#6e6e73] mb-1">Description</p>
              <p className="text-[13px] text-[#1d1d1f] leading-relaxed">{ticket.issue_description}</p>
            </div>
          )}
        </Section>
        {ticket.resolution && (
          <Section label="Resolution">
            <div className="bg-[#34c759]/5 border border-[#34c759]/20 rounded-xl px-3.5 py-3">
              <p className="text-[13px] text-[#1d1d1f] leading-relaxed">{ticket.resolution}</p>
            </div>
          </Section>
        )}
        <Section label="Call & WhatsApp">
          <Grid2 items={[
            ["WA Status", ticket.whatsapp_status ?? "—"],
            ["Call Status", CS?.label ?? "—"],
            ["Run ID", ticket.run_id ?? "—"],
          ]} mono />
        </Section>
      </div>
      <div className="px-5 py-4 border-t border-black/[0.06] flex flex-wrap gap-2">
        {ticket.recording_url && <a href={ticket.recording_url} target="_blank" rel="noreferrer" className="action-link-blue"><PhoneCall className="w-3.5 h-3.5" /> Recording</a>}
        {ticket.transcript_url && <a href={ticket.transcript_url} target="_blank" rel="noreferrer" className="action-link-gray"><ExternalLink className="w-3.5 h-3.5" /> Transcript</a>}
      </div>
    </div>
  )
}

function SupportRow({ ticket, selected, onSelect }: { ticket: SupportTicket; selected: boolean; onSelect: () => void }) {
  const S = TICKET_STATUS[(ticket.status ?? "open").toLowerCase()] ?? TICKET_STATUS.open
  const CS = ticket.call_status ? (CALL_STATUS_MAP[ticket.call_status] ?? null) : null
  return (
    <tr className={cn("border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer", selected && "bg-[#0066cc]/5")} onClick={onSelect}>
      <td className="px-4 py-3.5">
        <p className="text-[13px] font-medium text-[#1d1d1f]">{ticket.customer_name ?? "—"}</p>
        <p className="text-[11px] text-[#6e6e73]">{ticket.phone ?? "—"}</p>
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <p className="text-[13px] text-[#1d1d1f] truncate max-w-[180px]">{ticket.issue_type ?? "—"}</p>
        <p className="text-[11px] text-[#6e6e73] truncate max-w-[180px]">{ticket.issue_description ?? ""}</p>
      </td>
      <td className="px-4 py-3.5">
        <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>{S.label}</span>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        {CS ? <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", CS.bg, CS.color)}>{CS.label}</span> : <span className="text-[12px] text-[#c7c7cc]">—</span>}
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="text-[12px] text-[#6e6e73]">{ticket.order_date ? new Date(ticket.order_date).toLocaleDateString("en-IN") : "—"}</span>
      </td>
    </tr>
  )
}

// ─── Customer Review ─────────────────────────────────────────────────────────

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
}

const SAMPLE_REVIEW: Review = {
  id: 4001,
  order_date: new Date().toISOString(),
  customer_name: "Sneha Reddy",
  phone: "+91 77009 88765",
  email: "sneha@example.com",
  order_id: "ORD-7821",
  product_name: "Organic Face Serum",
  rating: 4,
  review_text: "Really good product! Noticed visible improvement after 2 weeks of consistent use. Packaging could be better.",
  sentiment: "positive",
  status: "pending",
  whatsapp_status: "delivered",
  call_status: "COMPLETED",
  run_id: "run_review_001",
}

const SENTIMENT_MAP: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: "Positive", color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  neutral:  { label: "Neutral",  color: "text-[#8a5900]", bg: "bg-[#ff9500]/10" },
  negative: { label: "Negative", color: "text-[#cc0000]", bg: "bg-[#ff3b30]/10" },
}

function ReviewDetailPanel({ review, onClose }: { review: Review; onClose: () => void }) {
  const sent = SENTIMENT_MAP[(review.sentiment ?? "").toLowerCase()]
  const CS = review.call_status ? (CALL_STATUS_MAP[review.call_status] ?? { label: review.call_status, color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" }) : null
  return (
    <div className="bg-white rounded-2xl hairline overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
        <div>
          <p className="text-[15px] font-semibold text-[#1d1d1f]">{review.customer_name ?? "Unknown"}</p>
          <p className="text-[12px] text-[#6e6e73]">Review #{review.id} · {review.order_date ? new Date(review.order_date).toLocaleDateString("en-IN") : "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          {sent && <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", sent.bg, sent.color)}>{sent.label}</span>}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#6e6e73]"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="overflow-y-auto px-5 py-4 space-y-4 max-h-[70vh]">
        <Section label="Rating">
          <div className="flex items-center gap-3 bg-[#f5f5f7] rounded-xl px-4 py-3">
            <StarRating rating={review.rating} />
            <span className="text-[15px] font-semibold text-[#1d1d1f]">{review.rating ?? "—"}/5</span>
          </div>
        </Section>
        {review.review_text && (
          <Section label="Review">
            <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-3">
              <p className="text-[13px] text-[#1d1d1f] leading-relaxed">{review.review_text}</p>
            </div>
          </Section>
        )}
        <Section label="Order">
          <Grid2 items={[
            ["Order ID", review.order_id ?? "—"],
            ["Product", review.product_name ?? "—"],
            ["Phone", review.phone ?? "—"],
            ["Email", review.email ?? "—"],
          ]} />
        </Section>
        <Section label="Call & WhatsApp">
          <Grid2 items={[
            ["WA Status", review.whatsapp_status ?? "—"],
            ["Call Status", CS?.label ?? "—"],
            ["Run ID", review.run_id ?? "—"],
          ]} mono />
        </Section>
      </div>
      <div className="px-5 py-4 border-t border-black/[0.06] flex flex-wrap gap-2">
        {review.recording_url && <a href={review.recording_url} target="_blank" rel="noreferrer" className="action-link-blue"><PhoneCall className="w-3.5 h-3.5" /> Recording</a>}
        {review.transcript_url && <a href={review.transcript_url} target="_blank" rel="noreferrer" className="action-link-gray"><ExternalLink className="w-3.5 h-3.5" /> Transcript</a>}
      </div>
    </div>
  )
}

function ReviewRow({ review, selected, onSelect }: { review: Review; selected: boolean; onSelect: () => void }) {
  const sent = SENTIMENT_MAP[(review.sentiment ?? "").toLowerCase()]
  const CS = review.call_status ? (CALL_STATUS_MAP[review.call_status] ?? null) : null
  return (
    <tr className={cn("border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer", selected && "bg-[#0066cc]/5")} onClick={onSelect}>
      <td className="px-4 py-3.5">
        <p className="text-[13px] font-medium text-[#1d1d1f]">{review.customer_name ?? "—"}</p>
        <p className="text-[11px] text-[#6e6e73]">{review.phone ?? "—"}</p>
      </td>
      <td className="px-4 py-3.5">
        <StarRating rating={review.rating} />
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <p className="text-[13px] text-[#1d1d1f] truncate max-w-[160px]">{review.product_name ?? "—"}</p>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        {sent ? <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", sent.bg, sent.color)}>{sent.label}</span> : <span className="text-[12px] text-[#c7c7cc]">—</span>}
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        {CS ? <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", CS.bg, CS.color)}>{CS.label}</span> : <span className="text-[12px] text-[#c7c7cc]">—</span>}
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="text-[12px] text-[#6e6e73]">{review.order_date ? new Date(review.order_date).toLocaleDateString("en-IN") : "—"}</span>
      </td>
    </tr>
  )
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  )
}

function Grid2({ items, mono }: { items: [string, string][]; mono?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(([k, v]) => (
        <div key={k} className="bg-[#f5f5f7] rounded-xl px-3.5 py-2.5">
          <p className="text-[11px] text-[#6e6e73]">{k}</p>
          <p className={cn("text-[13px] font-medium text-[#1d1d1f] truncate", mono && "font-mono")}>{v}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main Tab ────────────────────────────────────���───────────────────────────

type ShopifySubTab = "cod" | "cart" | "support" | "reviews"

const SUB_TABS: [ShopifySubTab, string][] = [
  ["cod",     "COD Confirmation"],
  ["cart",    "Add to Cart"],
  ["support", "Customer Support"],
  ["reviews", "Reviews"],
]

export function ShopifyTab() {
  const { tenant } = useTenant()
  const [subTab, setSubTab] = useState<ShopifySubTab>("cod")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [codStatusFilter, setCodStatusFilter] = useState("all")
  const [cartStatusFilter, setCartStatusFilter] = useState("all")

  const [selectedCod, setSelectedCod]       = useState<CodOrder | null>(null)
  const [selectedCart, setSelectedCart]     = useState<CartItem | null>(null)
  const [selectedSupport, setSelectedSupport] = useState<SupportTicket | null>(null)
  const [selectedReview, setSelectedReview]   = useState<Review | null>(null)

  // COD: filter by "order confirm" column — confirmed=true, rejected=false, pending=null
  const codStatusParam = codStatusFilter === "confirmed" ? "&order_confirm=true"
    : codStatusFilter === "rejected"  ? "&order_confirm=false"
    : codStatusFilter === "pending"   ? "&order_confirm=pending"
    : ""
  // Cart: confirmed = both COMPLETED + completed, pending = null call status
  const cartStatusParam = cartStatusFilter === "confirmed" ? "&call_status=confirmed"
    : cartStatusFilter === "pending" ? "&call_status=pending"
    : ""

  const { data: codData,     isLoading: codLoading }     = useSWR(subTab === "cod"     ? `/api/shopify/cod?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${codStatusParam}` : null, fetcher, { keepPreviousData: true })
  const { data: cartData,    isLoading: cartLoading }    = useSWR(subTab === "cart"    ? `/api/shopify/cart?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${cartStatusParam}` : null, fetcher, { keepPreviousData: true })
  const { data: supportData, isLoading: supportLoading } = useSWR(subTab === "support" ? `/api/support?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}` : null, fetcher, { keepPreviousData: true })
  const { data: reviewData,  isLoading: reviewLoading }  = useSWR(subTab === "reviews" ? `/api/reviews?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}` : null, fetcher, { keepPreviousData: true })

  const codOrders: CodOrder[]       = codData?.data     ?? []
  const cartRows: CartItem[]        = cartData?.data    ?? []
  const supportTickets: SupportTicket[] = supportData?.data ?? []
  const reviews: Review[]           = reviewData?.data  ?? []

  const isLoading = subTab === "cod" ? codLoading : subTab === "cart" ? cartLoading : subTab === "support" ? supportLoading : reviewLoading
  const total     = subTab === "cod" ? (codData?.count ?? 0) : subTab === "cart" ? (cartData?.count ?? 0) : subTab === "support" ? (supportData?.count ?? 0) : (reviewData?.count ?? 0)
  const error     = codData?.error ?? cartData?.error ?? supportData?.error ?? reviewData?.error

  const hasPanel =
    (subTab === "cod"     && !!selectedCod) ||
    (subTab === "cart"    && !!selectedCart) ||
    (subTab === "support" && !!selectedSupport) ||
    (subTab === "reviews" && !!selectedReview)

  function switchSubTab(id: ShopifySubTab) {
    setSubTab(id); setPage(1); setSearch("")
    setCodStatusFilter("all"); setCartStatusFilter("all")
    setSelectedCod(null); setSelectedCart(null); setSelectedSupport(null); setSelectedReview(null)
  }

  const placeholders = { cod: "Search orders, customers…", cart: "Search abandoned carts…", support: "Search customers, issues…", reviews: "Search customers, products…" }

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="bg-white rounded-2xl hairline px-2 py-2 inline-flex gap-1 flex-wrap">
        {SUB_TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => switchSubTab(id)}
            className={cn(
              "px-4 py-2 rounded-xl text-[13px] font-medium transition-all",
              subTab === id ? "bg-[#1d1d1f] text-white shadow-sm" : "text-[#6e6e73] hover:bg-[#f5f5f7]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl hairline px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3.5 py-2 min-w-[180px] flex-1">
          <Search className="w-4 h-4 text-[#6e6e73] shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={placeholders[subTab]}
            className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-full placeholder:text-[#6e6e73]"
          />
        </div>

        {/* COD status filter pills */}
        {subTab === "cod" && (
          <div className="flex items-center gap-1 flex-wrap">
            {(["all", "confirmed", "rejected", "pending"] as const).map(s => (
              <button
                key={s}
                onClick={() => { setCodStatusFilter(s); setPage(1) }}
                className={cn(
                  "text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors capitalize",
                  codStatusFilter === s
                    ? s === "confirmed" ? "bg-[#34c759] text-white"
                      : s === "rejected" ? "bg-[#ff3b30] text-white"
                      : s === "pending"  ? "bg-[#ff9500] text-white"
                      : "bg-[#1d1d1f] text-white"
                    : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0]"
                )}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Cart status filter pills */}
        {subTab === "cart" && (
          <div className="flex items-center gap-1 flex-wrap">
            {(["all", "confirmed", "pending"] as const).map(s => (
              <button
                key={s}
                onClick={() => { setCartStatusFilter(s); setPage(1) }}
                className={cn(
                  "text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors capitalize",
                  cartStatusFilter === s
                    ? s === "confirmed" ? "bg-[#34c759] text-white"
                      : s === "pending"  ? "bg-[#ff9500] text-white"
                      : "bg-[#1d1d1f] text-white"
                    : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0]"
                )}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}

        <span className="text-[12px] text-[#6e6e73] shrink-0 ml-auto">{total} records</span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-[13px] text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Table + side panel grid */}
      <div className={cn(hasPanel ? "grid grid-cols-1 lg:grid-cols-5 gap-4" : "")}>

        {/* ── Table ── */}
        <div className={cn("bg-white rounded-2xl hairline overflow-hidden", hasPanel ? "lg:col-span-3" : "")}>
          <div className="overflow-x-auto">

            {/* COD */}
            {subTab === "cod" && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    {[{ label: "Order" }, { label: "Customer", sm: true }, { label: "Product", lg: true }, { label: "Amount" }, { label: "Status" }, { label: "Run ID", md: true }].map((h, i) => (
                      <th key={i} className={cn("px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider", h.sm && "hidden sm:table-cell", h.lg && "hidden lg:table-cell", h.md && "hidden md:table-cell")}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? <SkeletonRows cols={6} /> : codOrders.length === 0 ? (
                    <>
                      <CodRow order={SAMPLE_COD} selected={selectedCod?.["order id"] === SAMPLE_COD["order id"]} onSelect={() => setSelectedCod(prev => prev?.["order id"] === SAMPLE_COD["order id"] ? null : SAMPLE_COD)} />
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-[12px] text-[#c7c7cc]">Sample record — no live data found</td></tr>
                    </>
                  ) : codOrders.map(o => (
                    <CodRow key={o["order id"]} order={o} selected={selectedCod?.["order id"] === o["order id"]} onSelect={() => setSelectedCod(prev => prev?.["order id"] === o["order id"] ? null : o)} />
                  ))}
                </tbody>
              </table>
            )}

            {/* Cart */}
            {subTab === "cart" && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    {[{ label: "Customer" }, { label: "Product", lg: true }, { label: "Cart Value" }, { label: "Date", sm: true }, { label: "Call Status" }].map((h, i) => (
                      <th key={i} className={cn("px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider", h.lg && "hidden lg:table-cell", h.sm && "hidden sm:table-cell")}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? <SkeletonRows cols={5} /> : cartRows.length === 0 ? (
                    <>
                      <CartRow row={SAMPLE_CART} selected={selectedCart?.["checkout id"] === SAMPLE_CART["checkout id"]} onSelect={() => setSelectedCart(prev => prev?.["checkout id"] === SAMPLE_CART["checkout id"] ? null : SAMPLE_CART)} />
                      <tr><td colSpan={5} className="px-4 py-4 text-center text-[12px] text-[#c7c7cc]">Sample record — no live data found</td></tr>
                    </>
                  ) : cartRows.map((r, i) => (
                    <CartRow key={r["checkout id"] ?? i} row={r} selected={selectedCart?.["checkout id"] === r["checkout id"]} onSelect={() => setSelectedCart(prev => prev?.["checkout id"] === r["checkout id"] ? null : r)} />
                  ))}
                </tbody>
              </table>
            )}

            {/* Support */}
            {subTab === "support" && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    {[{ label: "Customer" }, { label: "Issue", lg: true }, { label: "Status" }, { label: "Call", sm: true }, { label: "Date", md: true }].map((h, i) => (
                      <th key={i} className={cn("px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider", h.lg && "hidden lg:table-cell", h.sm && "hidden sm:table-cell", h.md && "hidden md:table-cell")}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? <SkeletonRows cols={5} /> : supportTickets.length === 0 ? (
                    <>
                      <SupportRow ticket={SAMPLE_SUPPORT} selected={selectedSupport?.id === SAMPLE_SUPPORT.id} onSelect={() => setSelectedSupport(prev => prev?.id === SAMPLE_SUPPORT.id ? null : SAMPLE_SUPPORT)} />
                      <tr><td colSpan={5} className="px-4 py-4 text-center text-[12px] text-[#c7c7cc]">Sample record — no live data found</td></tr>
                    </>
                  ) : supportTickets.map(t => (
                    <SupportRow key={t.id} ticket={t} selected={selectedSupport?.id === t.id} onSelect={() => setSelectedSupport(prev => prev?.id === t.id ? null : t)} />
                  ))}
                </tbody>
              </table>
            )}

            {/* Reviews */}
            {subTab === "reviews" && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    {[{ label: "Customer" }, { label: "Rating" }, { label: "Product", lg: true }, { label: "Sentiment", sm: true }, { label: "Call", md: true }, { label: "Date", md: true }].map((h, i) => (
                      <th key={i} className={cn("px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider", h.lg && "hidden lg:table-cell", h.sm && "hidden sm:table-cell", h.md && "hidden md:table-cell")}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? <SkeletonRows cols={6} /> : reviews.length === 0 ? (
                    <>
                      <ReviewRow review={SAMPLE_REVIEW} selected={selectedReview?.id === SAMPLE_REVIEW.id} onSelect={() => setSelectedReview(prev => prev?.id === SAMPLE_REVIEW.id ? null : SAMPLE_REVIEW)} />
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-[12px] text-[#c7c7cc]">Sample record — no live data found</td></tr>
                    </>
                  ) : reviews.map(r => (
                    <ReviewRow key={r.id} review={r} selected={selectedReview?.id === r.id} onSelect={() => setSelectedReview(prev => prev?.id === r.id ? null : r)} />
                  ))}
                </tbody>
              </table>
            )}

          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04]">
            <p className="text-[12px] text-[#6e6e73]">{total} total</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors">Prev</button>
              <span className="text-[12px] font-semibold text-[#0066cc] w-7 h-7 rounded-full bg-[#0066cc]/10 flex items-center justify-center">{page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(subTab === "cod" ? codOrders : subTab === "cart" ? cartRows : subTab === "support" ? supportTickets : reviews).length < 20}
                className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        </div>

        {/* ── Detail panel ── */}
        {hasPanel && (
          <div className="lg:col-span-2">
            {subTab === "cod"     && selectedCod     && <CodDetailPanel     order={selectedCod}       onClose={() => setSelectedCod(null)} />}
            {subTab === "cart"    && selectedCart    && <CartDetailPanel    row={selectedCart}         onClose={() => setSelectedCart(null)} />}
            {subTab === "support" && selectedSupport && <SupportDetailPanel ticket={selectedSupport}   onClose={() => setSelectedSupport(null)} />}
            {subTab === "reviews" && selectedReview  && <ReviewDetailPanel  review={selectedReview}    onClose={() => setSelectedReview(null)} />}
          </div>
        )}

      </div>
    </div>
  )
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-black/[0.04]">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
          ))}
        </tr>
      ))}
    </>
  )
}
