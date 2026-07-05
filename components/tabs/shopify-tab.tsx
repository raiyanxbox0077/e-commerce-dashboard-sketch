"use client"

import { useState } from "react"
import { Search, ExternalLink, PhoneCall, MessageCircle, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Clock, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── COD Confirmation ─────────────────────────────────────────────────────────

interface CodOrder {
  id: number
  order_name: string
  customer_name: string
  phone: string
  product: string
  amount: number
  status: "confirmed" | "rejected" | "pending" | "no_answer"
  run_id: string
  call_duration: string
  order_date: string
  city: string
}

const COD_ORDERS: CodOrder[] = [
  { id: 1, order_name: "#10482", customer_name: "Priya Sharma", phone: "+91 98765 43210", product: "Blue Cotton Kurta (M)", amount: 1299, status: "confirmed", run_id: "run_01jx2a", call_duration: "2m 22s", order_date: "2026-07-06", city: "Mumbai" },
  { id: 2, order_name: "#10479", customer_name: "Meera Nair", phone: "+91 54321 09876", product: "Silk Saree (Ivory)", amount: 2499, status: "confirmed", run_id: "run_01jx2e", call_duration: "1m 38s", order_date: "2026-07-06", city: "Bengaluru" },
  { id: 3, order_name: "#10477", customer_name: "Anita Patel", phone: "+91 76543 21098", product: "Denim Jacket (L)", amount: 1899, status: "no_answer", run_id: "run_01jx2c", call_duration: "0m 8s", order_date: "2026-07-06", city: "Ahmedabad" },
  { id: 4, order_name: "#10475", customer_name: "Lakshmi Iyer", phone: "+91 32109 87654", product: "Chiffon Dupatta", amount: 799, status: "rejected", run_id: "run_01jx2g", call_duration: "2m 55s", order_date: "2026-07-05", city: "Chennai" },
  { id: 5, order_name: "#10470", customer_name: "Suresh Reddy", phone: "+91 43210 98765", product: "Formal Shirt (XL)", amount: 1599, status: "pending", run_id: "—", call_duration: "—", order_date: "2026-07-05", city: "Hyderabad" },
]

const COD_STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  confirmed: { label: "Confirmed", color: "text-[#1a7a32]", bg: "bg-[#34c759]/10", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-[#cc0000]", bg: "bg-[#ff3b30]/10", icon: AlertCircle },
  pending: { label: "Pending", color: "text-[#8a5900]", bg: "bg-[#ff9500]/10", icon: Clock },
  no_answer: { label: "No Answer", color: "text-[#8a5900]", bg: "bg-[#ff9500]/10", icon: AlertCircle },
}

function CodRow({ order }: { order: CodOrder }) {
  const [expanded, setExpanded] = useState(false)
  const S = COD_STATUS[order.status]
  const SIcon = S.icon

  return (
    <>
      <tr
        className="border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3.5">
          <p className="text-[13px] font-semibold text-[#1d1d1f]">{order.order_name}</p>
          <p className="text-[11px] text-[#6e6e73]">{order.order_date}</p>
        </td>
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <p className="text-[13px] font-medium text-[#1d1d1f]">{order.customer_name}</p>
          <p className="text-[11px] text-[#6e6e73]">{order.phone}</p>
        </td>
        <td className="px-4 py-3.5 hidden lg:table-cell">
          <p className="text-[13px] text-[#1d1d1f] truncate max-w-[200px]">{order.product}</p>
          <p className="text-[11px] text-[#6e6e73]">{order.city}</p>
        </td>
        <td className="px-4 py-3.5">
          <p className="text-[14px] font-semibold text-[#1d1d1f]">₹{order.amount.toLocaleString("en-IN")}</p>
        </td>
        <td className="px-4 py-3.5">
          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full", S.bg, S.color)}>
            <SIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{S.label}</span>
          </span>
        </td>
        <td className="px-4 py-3.5 hidden md:table-cell">
          <code className="text-[11px] font-mono text-[#6e6e73]">{order.run_id}</code>
        </td>
        <td className="px-4 py-3.5">
          {expanded ? <ChevronUp className="w-4 h-4 text-[#6e6e73]" /> : <ChevronDown className="w-4 h-4 text-[#6e6e73]" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[#f5f5f7]">
          <td colSpan={7} className="px-5 py-4">
            <div className="flex flex-wrap gap-3">
              <div className="bg-white rounded-xl px-4 py-3 hairline flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6e6e73]" />
                <span className="text-[13px] text-[#1d1d1f]">Call duration: <strong>{order.call_duration}</strong></span>
              </div>
              {order.run_id !== "—" && (
                <>
                  <a href="#" className="bg-white rounded-xl px-4 py-3 hairline flex items-center gap-2 text-[#0066cc] text-[13px] font-medium hover:bg-[#f0f0f5] transition-colors">
                    <PhoneCall className="w-4 h-4" /> View Call Recording
                  </a>
                  <a href="#" className="bg-white rounded-xl px-4 py-3 hairline flex items-center gap-2 text-[#0066cc] text-[13px] font-medium hover:bg-[#f0f0f5] transition-colors">
                    <MessageCircle className="w-4 h-4" /> View Transcript
                  </a>
                </>
              )}
              {order.status === "pending" && (
                <button className="bg-[#0066cc] text-white rounded-full px-4 py-2 text-[13px] font-medium flex items-center gap-1.5 active:scale-95 transition-transform">
                  <PhoneCall className="w-3.5 h-3.5" /> Trigger Call
                </button>
              )}
              {order.status === "no_answer" && (
                <button className="bg-[#0066cc] text-white rounded-full px-4 py-2 text-[13px] font-medium flex items-center gap-1.5 active:scale-95 transition-transform">
                  <PhoneCall className="w-3.5 h-3.5" /> Retry Call
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Add to Cart ──────────────────────────────────────────────────────────────

interface CartRow {
  checkout_id: number
  checkout_token: string
  customer_name: string
  phone: string
  email: string
  product_name: string
  variant: string
  quantity: string
  product_price: number
  total_amount: number
  city: string
  order_date: string
  abandoned_checkout_url: string
  wa_sent: boolean
}

const CART_ROWS: CartRow[] = [
  { checkout_id: 1001, checkout_token: "ct_abc123", customer_name: "Ravi Kumar", phone: "+91 87654 32109", email: "ravi@example.com", product_name: "Black Joggers", variant: "L / Black", quantity: "1", product_price: 899, total_amount: 949, city: "Delhi", order_date: "2026-07-06", abandoned_checkout_url: "#", wa_sent: true },
  { checkout_id: 1002, checkout_token: "ct_def456", customer_name: "Nisha Gupta", phone: "+91 91234 56789", email: "nisha@example.com", product_name: "Floral Kurti Set", variant: "M / Yellow", quantity: "2", product_price: 1199, total_amount: 2448, city: "Jaipur", order_date: "2026-07-06", abandoned_checkout_url: "#", wa_sent: false },
  { checkout_id: 1003, checkout_token: "ct_ghi789", customer_name: "Arjun Mehta", phone: "+91 70000 11111", email: "arjun@example.com", product_name: "Sports Shoes", variant: "42 / White", quantity: "1", product_price: 2299, total_amount: 2349, city: "Pune", order_date: "2026-07-05", abandoned_checkout_url: "#", wa_sent: true },
]

function CartRowComp({ row }: { row: CartRow }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <tr
        className="border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3.5">
          <p className="text-[13px] font-medium text-[#1d1d1f]">{row.customer_name}</p>
          <p className="text-[11px] text-[#6e6e73]">{row.phone}</p>
        </td>
        <td className="px-4 py-3.5 hidden lg:table-cell">
          <p className="text-[13px] text-[#1d1d1f] truncate max-w-[200px]">{row.product_name}</p>
          <p className="text-[11px] text-[#6e6e73]">{row.variant}</p>
        </td>
        <td className="px-4 py-3.5">
          <p className="text-[14px] font-semibold text-[#1d1d1f]">₹{row.total_amount.toLocaleString("en-IN")}</p>
        </td>
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <span className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full",
            row.wa_sent ? "bg-[#34c759]/10 text-[#1a7a32]" : "bg-[#ff9500]/10 text-[#8a5900]"
          )}>
            <MessageCircle className="w-3 h-3" />
            {row.wa_sent ? "Sent" : "Not sent"}
          </span>
        </td>
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <span className="text-[12px] text-[#6e6e73]">{row.order_date}</span>
        </td>
        <td className="px-4 py-3.5">
          {expanded ? <ChevronUp className="w-4 h-4 text-[#6e6e73]" /> : <ChevronDown className="w-4 h-4 text-[#6e6e73]" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[#f5f5f7]">
          <td colSpan={6} className="px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {[
                ["Email", row.email],
                ["City", row.city],
                ["Qty", row.quantity],
                ["Unit Price", `₹${row.product_price}`],
              ].map(([k, v]) => (
                <div key={k} className="bg-white rounded-xl px-3.5 py-2.5 hairline">
                  <p className="text-[11px] text-[#6e6e73]">{k}</p>
                  <p className="text-[13px] font-medium text-[#1d1d1f]">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={row.abandoned_checkout_url} className="inline-flex items-center gap-1.5 bg-white text-[#0066cc] text-[13px] font-medium rounded-full px-4 py-2 hairline hover:bg-[#f0f0f5] transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Open Checkout URL
              </a>
              {!row.wa_sent && (
                <button className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-[13px] font-medium rounded-full px-4 py-2 active:scale-95 transition-transform">
                  <MessageCircle className="w-3.5 h-3.5" /> Send WA Recovery
                </button>
              )}
              <button className="inline-flex items-center gap-1.5 bg-[#0066cc] text-white text-[13px] font-medium rounded-full px-4 py-2 active:scale-95 transition-transform">
                <PhoneCall className="w-3.5 h-3.5" /> Trigger Recovery Call
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Tab wrapper ──────────────────────────────────────────────────────────────

type ShopifySubTab = "cod" | "cart"

export function ShopifyTab() {
  const [subTab, setSubTab] = useState<ShopifySubTab>("cod")
  const [search, setSearch] = useState("")

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="bg-white rounded-2xl hairline px-2 py-2 inline-flex gap-1">
        {([["cod", "COD Confirmation"], ["cart", "Add to Cart"]] as [ShopifySubTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder={subTab === "cod" ? "Search orders, customers…" : "Search abandoned carts…"}
            className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-full placeholder:text-[#6e6e73]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl hairline overflow-hidden">
        <div className="overflow-x-auto">
          {subTab === "cod" ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {["Order", "Customer", "Product", "Amount", "Status", "Run ID", ""].map((h, i) => (
                    <th key={i} className={cn(
                      "px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider",
                      h === "Product" && "hidden lg:table-cell",
                      h === "Customer" && "hidden sm:table-cell",
                      h === "Run ID" && "hidden md:table-cell",
                    )}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COD_ORDERS.filter(o => !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.order_name.includes(search)).map((o) => (
                  <CodRow key={o.id} order={o} />
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {["Customer", "Product", "Cart Value", "WA Recovery", "Date", ""].map((h, i) => (
                    <th key={i} className={cn(
                      "px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider",
                      h === "Product" && "hidden lg:table-cell",
                      (h === "WA Recovery" || h === "Date") && "hidden sm:table-cell",
                    )}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CART_ROWS.filter(r => !search || r.customer_name.toLowerCase().includes(search.toLowerCase())).map((r) => (
                  <CartRowComp key={r.checkout_id} row={r} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer summary */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#6e6e73]" />
            <p className="text-[12px] text-[#6e6e73]">
              {subTab === "cod" ? `${COD_ORDERS.length} COD orders` : `${CART_ROWS.length} abandoned carts`}
            </p>
          </div>
          {subTab === "cart" && (
            <p className="text-[12px] font-semibold text-[#1d1d1f]">
              Total: ₹{CART_ROWS.reduce((s, r) => s + r.total_amount, 0).toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
