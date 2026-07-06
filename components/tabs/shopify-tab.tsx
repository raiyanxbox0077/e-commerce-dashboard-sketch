"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search, ExternalLink, PhoneCall, MessageCircle, ShoppingBag, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTenant } from "@/hooks/use-tenant"

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── COD ────────────────────────────────────────────────────────────────────

// Exact column names from "E-commerce COD confimation" table
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

const COD_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  completed:  { label: "Completed",  color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  confirmed:  { label: "Confirmed",  color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  rejected:   { label: "Rejected",   color: "text-[#cc0000]", bg: "bg-[#ff3b30]/10" },
  pending:    { label: "Pending",    color: "text-[#8a5900]", bg: "bg-[#ff9500]/10" },
  no_answer:  { label: "No Answer",  color: "text-[#8a5900]", bg: "bg-[#ff9500]/10" },
}

// ─── COD Detail Panel ───────────────────────────────────────────────────────

function CodDetailPanel({ order, onClose }: { order: CodOrder; onClose: () => void }) {
  const statusKey = (order.status ?? "pending").toLowerCase()
  const S = COD_STATUS[statusKey] ?? { label: order.status ?? "—", color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" }
  const orderId = order.order_number ?? `#${order["order id"] ?? "—"}`

  return (
    <div className="bg-white rounded-2xl hairline overflow-hidden flex flex-col h-full">
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
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div>
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Customer</p>
          <div className="grid grid-cols-2 gap-2">
            {[["Phone", order.phone ?? "—"], ["Email", order.email ?? "—"]].map(([k, v]) => (
              <div key={k} className="bg-[#f5f5f7] rounded-xl px-3.5 py-2.5">
                <p className="text-[11px] text-[#6e6e73]">{k}</p>
                <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Order Details</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Confirmation", order.confirmation_number ?? "—"],
              ["Payment", order.payment_method ?? "—"],
              ["SKU", order.sku ?? "—"],
              ["Variant", order.variant ?? "—"],
              ["Qty", order.quantity ?? "—"],
              ["Product Price", order.product_price ? `₹${order.product_price}` : "—"],
              ["Shipping", order.shipping_charge ? `₹${order.shipping_charge}` : "—"],
              ["Tax", order.tax ? `₹${order.tax}` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#f5f5f7] rounded-xl px-3.5 py-2.5">
                <p className="text-[11px] text-[#6e6e73]">{k}</p>
                <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Delivery</p>
          <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-3">
            <p className="text-[13px] text-[#1d1d1f]">
              {[order.address_line1, order.address_line2, order.city, order.state, order.pincode].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        </div>
        {order.RUN_ID && (
          <div>
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Call</p>
            <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-2.5">
              <p className="text-[11px] text-[#6e6e73]">Run ID</p>
              <p className="text-[12px] font-mono text-[#1d1d1f]">{order.RUN_ID}</p>
            </div>
          </div>
        )}
      </div>
      <div className="px-5 py-4 border-t border-black/[0.06] flex flex-wrap gap-2">
        {order.Recording_url && (
          <a href={order.Recording_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-white hairline text-[#0066cc] text-[13px] font-medium rounded-full px-4 py-2 hover:bg-[#f0f0f5] transition-colors">
            <PhoneCall className="w-3.5 h-3.5" /> Recording
          </a>
        )}
        {order.transcript_url && (
          <a href={order.transcript_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-white hairline text-[#6e6e73] text-[13px] font-medium rounded-full px-4 py-2 hover:bg-[#f0f0f5] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Transcript
          </a>
        )}
        <button className="inline-flex items-center gap-1.5 bg-[#0066cc] text-white text-[13px] font-medium rounded-full px-4 py-2 active:scale-95 transition-transform">
          <PhoneCall className="w-3.5 h-3.5" /> Trigger Call
        </button>
      </div>
    </div>
  )
}

function CodRow({ order, selected, onSelect }: { order: CodOrder; selected: boolean; onSelect: () => void }) {
  const statusKey = (order.status ?? "pending").toLowerCase()
  const S = COD_STATUS[statusKey] ?? { label: order.status ?? "—", color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" }
  const orderId = order.order_number ?? `#${order["order id"] ?? "—"}`

  return (
    <tr
      className={cn("border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer", selected && "bg-[#0066cc]/5")}
      onClick={onSelect}
    >
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

// Exact column names from "E-commerce add to cart" table
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
}

const CALL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: "Completed",  color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  completed:   { label: "Completed",  color: "text-[#1a7a32]", bg: "bg-[#34c759]/10" },
  FAILED:      { label: "Failed",     color: "text-[#cc0000]", bg: "bg-[#ff3b30]/10" },
  IN_PROGRESS: { label: "In Progress",color: "text-[#0066cc]", bg: "bg-[#0066cc]/10" },
}

function CartDetailPanel({ row, onClose }: { row: CartItem; onClose: () => void }) {
  const callSt = row["call status"] ?? ""
  const CS = CALL_STATUS[callSt] ?? (callSt ? { label: callSt, color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" } : null)
  return (
    <div className="bg-white rounded-2xl hairline overflow-hidden flex flex-col h-full">
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
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div>
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Product</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Product", row.product_name ?? "—"],
              ["Variant", row.variant ?? "—"],
              ["SKU", row.sku ?? "—"],
              ["Qty", row.quantity ?? "—"],
              ["Unit Price", row.product_price ? `₹${row.product_price}` : "—"],
              ["Shipping", row.shipping_charge ? `₹${row.shipping_charge}` : "—"],
              ["Tax", row.tax ? `₹${row.tax}` : "—"],
              ["Email", row.email ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#f5f5f7] rounded-xl px-3.5 py-2.5">
                <p className="text-[11px] text-[#6e6e73]">{k}</p>
                <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Delivery</p>
          <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-3">
            <p className="text-[13px] text-[#1d1d1f]">
              {[row.address_line1, row.address_line2, row.city, row.state, row.pincode].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">WhatsApp</p>
          <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-2.5">
            <p className="text-[11px] text-[#6e6e73]">Status</p>
            <p className="text-[13px] font-medium text-[#1d1d1f]">{row["WhatsApp Status"] ?? "—"}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 border-t border-black/[0.06] flex flex-wrap gap-2">
        {row.abandoned_checkout_url && (
          <a href={row.abandoned_checkout_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-white hairline text-[#0066cc] text-[13px] font-medium rounded-full px-4 py-2 hover:bg-[#f0f0f5] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Open Checkout
          </a>
        )}
        <button className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-[13px] font-medium rounded-full px-4 py-2 active:scale-95 transition-transform">
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Recovery
        </button>
        <button className="inline-flex items-center gap-1.5 bg-[#0066cc] text-white text-[13px] font-medium rounded-full px-4 py-2 active:scale-95 transition-transform">
          <PhoneCall className="w-3.5 h-3.5" /> Trigger Call
        </button>
      </div>
    </div>
  )
}

function CartRow({ row, selected, onSelect }: { row: CartItem; selected: boolean; onSelect: () => void }) {
  const callSt = row["call status"] ?? ""
  const CS = CALL_STATUS[callSt] ?? (callSt ? { label: callSt, color: "text-[#6e6e73]", bg: "bg-[#f5f5f7]" } : null)
  return (
    <tr
      className={cn("border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer", selected && "bg-[#0066cc]/5")}
      onClick={onSelect}
    >
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

// ─── Main Tab ────────────────────────────────────────────────────────────────

type ShopifySubTab = "cod" | "cart"

export function ShopifyTab() {
  const { tenant } = useTenant()
  const [subTab, setSubTab] = useState<ShopifySubTab>("cod")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedCod, setSelectedCod] = useState<CodOrder | null>(null)
  const [selectedCart, setSelectedCart] = useState<CartItem | null>(null)

  const { data: codData, isLoading: codLoading } = useSWR(
    subTab === "cod"
      ? `/api/shopify/cod?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`
      : null,
    fetcher,
    { keepPreviousData: true }
  )

  const { data: cartData, isLoading: cartLoading } = useSWR(
    subTab === "cart"
      ? `/api/shopify/cart?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`
      : null,
    fetcher,
    { keepPreviousData: true }
  )

  const codOrders: CodOrder[] = codData?.data ?? []
  const cartRows: CartItem[] = cartData?.data ?? []
  const isLoading = subTab === "cod" ? codLoading : cartLoading
  const total = subTab === "cod" ? (codData?.count ?? 0) : (cartData?.count ?? 0)

  const hasPanel = subTab === "cod" ? !!selectedCod : !!selectedCart

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="bg-white rounded-2xl hairline px-2 py-2 inline-flex gap-1">
        {([["cod", "COD Confirmation"], ["cart", "Add to Cart"]] as [ShopifySubTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => { setSubTab(id as ShopifySubTab); setPage(1); setSearch(""); setSelectedCod(null); setSelectedCart(null) }}
            className={cn(
              "px-5 py-2 rounded-xl text-[13px] font-medium transition-all",
              subTab === id ? "bg-[#1d1d1f] text-white shadow-sm" : "text-[#6e6e73] hover:bg-[#f5f5f7]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl hairline px-4 py-3 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3.5 py-2">
          <Search className="w-4 h-4 text-[#6e6e73] shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={subTab === "cod" ? "Search orders, customers…" : "Search abandoned carts…"}
            className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-full placeholder:text-[#6e6e73]"
          />
        </div>
        <span className="text-[12px] text-[#6e6e73] shrink-0">{total} records</span>
      </div>

      {/* Error */}
      {(codData?.error || cartData?.error) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-[13px] text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {codData?.error ?? cartData?.error}
        </div>
      )}

      {/* Table + side panel */}
      <div className={cn("gap-4", hasPanel ? "grid grid-cols-1 lg:grid-cols-5" : "")}>
      <div className={cn("bg-white rounded-2xl hairline overflow-hidden", hasPanel ? "lg:col-span-3" : "")}>
        <div className="overflow-x-auto">
          {subTab === "cod" ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {[
                    { label: "Order" },
                    { label: "Customer", sm: true },
                    { label: "Product", lg: true },
                    { label: "Amount" },
                    { label: "Status" },
                    { label: "Run ID", md: true },
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
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : codOrders.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-[14px] text-[#6e6e73]">No COD orders found</td></tr>
                ) : (
                  codOrders.map(o => (
                    <CodRow
                      key={o["order id"]}
                      order={o}
                      selected={selectedCod?.["order id"] === o["order id"]}
                      onSelect={() => setSelectedCod(selectedCod?.["order id"] === o["order id"] ? null : o)}
                    />
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {[
                      { label: "Customer" },
                      { label: "Product", lg: true },
                      { label: "Cart Value" },
                      { label: "Date", sm: true },
                      { label: "Call Status" },
                  ].map((h, i) => (
                    <th key={i} className={cn(
                      "px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider",
                      h.sm && "hidden sm:table-cell",
                      h.lg && "hidden lg:table-cell",
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
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : cartRows.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-[14px] text-[#6e6e73]">No abandoned carts found</td></tr>
                ) : (
                  cartRows.map((r, i) => (
                    <CartRow
                      key={r["checkout id"] ?? i}
                      row={r}
                      selected={selectedCart?.["checkout id"] === r["checkout id"]}
                      onSelect={() => setSelectedCart(selectedCart?.["checkout id"] === r["checkout id"] ? null : r)}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04]">
          <p className="text-[12px] text-[#6e6e73]">{total} total</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <span className="text-[12px] font-semibold text-[#0066cc] w-7 h-7 rounded-full bg-[#0066cc]/10 flex items-center justify-center">{page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(subTab === "cod" ? codOrders : cartRows).length < 20}
              className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebf0] disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail panel (right column when a row is selected) */}
      {hasPanel && (
        <div className="lg:col-span-2 h-fit lg:sticky lg:top-0">
          {subTab === "cod" && selectedCod && (
            <CodDetailPanel order={selectedCod} onClose={() => setSelectedCod(null)} />
          )}
          {subTab === "cart" && selectedCart && (
            <CartDetailPanel row={selectedCart} onClose={() => setSelectedCart(null)} />
          )}
        </div>
      )}
      </div>
    </div>
  )
}
