"use client"

import { useState } from "react"

type NavTab = "overview" | "shopify" | "whatsapp"
type ShopifyTab = "cod" | "cart"

export default function DashboardBlueprint() {
  const [activeNav, setActiveNav] = useState<NavTab>("overview")
  const [activeShopify, setActiveShopify] = useState<ShopifyTab>("cod")

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">
      {/* ── TOP NAV ── */}
      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between bg-[#161b22]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide text-white">AI Dashboard</span>
          <span className="text-xs text-white/30 ml-1">Blueprint Sketch</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Dograh AI
          </span>
          <span className="text-xs px-2 py-1 rounded bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/20">
            BotSailor
          </span>
          <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Supabase
          </span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-56 border-r border-white/10 bg-[#161b22] flex flex-col py-4 shrink-0">
          <nav className="flex flex-col gap-1 px-3">
            {(
              [
                { id: "overview", label: "Overview", icon: OverviewIcon, desc: "Analytics & KPIs" },
                { id: "shopify", label: "Shopify", icon: ShopifyIcon, desc: "COD · Add to Cart" },
                { id: "whatsapp", label: "WhatsApp", icon: WAIcon, desc: "Chat conversations" },
              ] as { id: NavTab; label: string; icon: React.FC; desc: string }[]
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  activeNav === item.id
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon />
                <div>
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-[10px] text-white/40 leading-tight">{item.desc}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* API legend */}
          <div className="mt-auto px-4 pb-2">
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Data Sources</div>
            <div className="space-y-1.5">
              <LegendItem color="bg-emerald-500" label="Dograh API" sub="Runs · Recordings · Transcripts" />
              <LegendItem color="bg-[#25d366]" label="BotSailor API" sub="Subscribers · Chat · Inbox" />
              <LegendItem color="bg-orange-400" label="Supabase DB" sub="COD Orders · Add to Cart" />
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto">
          {activeNav === "overview" && <OverviewTab />}
          {activeNav === "shopify" && (
            <ShopifyTab activeShopify={activeShopify} setActiveShopify={setActiveShopify} />
          )}
          {activeNav === "whatsapp" && <WhatsAppTab />}
        </main>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   OVERVIEW TAB
─────────────────────────────────────────────── */
function OverviewTab() {
  return (
    <div className="p-6 space-y-6">
      <SectionHeader
        title="Overview"
        subtitle="Aggregated analytics across Dograh AI calls & WhatsApp conversations"
        badge="Live"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Calls" value="1,284" delta="+12%" icon="📞" color="emerald" />
        <KpiCard label="COD Orders" value="342" delta="+8%" icon="📦" color="orange" />
        <KpiCard label="Add to Carts" value="891" delta="+23%" icon="🛒" color="blue" />
        <KpiCard label="WA Conversations" value="2,104" delta="+5%" icon="💬" color="green" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <WireframeCard title="Call Volume (7d)" span={2} height="h-44">
          <BarChartPlaceholder />
        </WireframeCard>
        <WireframeCard title="Conversion Funnel" height="h-44">
          <FunnelPlaceholder />
        </WireframeCard>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-3 gap-4">
        <WireframeCard title="Order Status Breakdown" height="h-40">
          <DonutPlaceholder />
        </WireframeCard>
        <WireframeCard title="Call Success Rate by Agent" span={2} height="h-40">
          <HBarPlaceholder />
        </WireframeCard>
      </div>

      {/* Schema highlight */}
      <div className="grid grid-cols-2 gap-4">
        <SchemaCard
          title="COD Orders Schema"
          color="orange"
          source="Supabase → cod_confirmation"
          fields={[
            { name: "RUN_ID", type: "integer", note: "→ Dograh Run ID" },
            { name: "order_number", type: "text", note: "Shopify order #" },
            { name: "payment_method", type: "text", note: "COD / Prepaid" },
            { name: "order confirm", type: "text", note: "AI confirmed?" },
            { name: "recording_url", type: "text", note: "Dograh recording" },
            { name: "transcript_url", type: "text", note: "Dograh transcript" },
            { name: "status", type: "text", note: "Order status" },
            { name: "WhatsApp Status", type: "text", note: "WA delivery" },
          ]}
        />
        <SchemaCard
          title="Add to Cart Schema"
          color="blue"
          source="Supabase → E-commerce add to cart"
          fields={[
            { name: "checkout id", type: "bigint", note: "Primary key" },
            { name: "checkout_token", type: "text", note: "Shopify token" },
            { name: "customer_name", type: "text", note: "Buyer name" },
            { name: "product_name", type: "text", note: "Item" },
            { name: "quantity", type: "text", note: "Cart qty" },
            { name: "total_amount", type: "numeric", note: "₹ value" },
            { name: "abandoned_checkout_url", type: "text", note: "Recovery link" },
            { name: "phone / email", type: "text", note: "Contact info" },
          ]}
        />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   SHOPIFY TAB
─────────────────────────────────────────────── */
function ShopifyTab({
  activeShopify,
  setActiveShopify,
}: {
  activeShopify: ShopifyTab
  setActiveShopify: (t: ShopifyTab) => void
}) {
  return (
    <div className="p-6 space-y-5">
      <SectionHeader
        title="Shopify"
        subtitle="Manage COD confirmations & abandoned cart recovery powered by Dograh AI calls"
        badge="Shopify"
        badgeColor="orange"
      />

      {/* Sub tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {(
          [
            { id: "cod", label: "COD Confirmation", icon: "📦", desc: "AI call confirms Cash-on-Delivery orders" },
            { id: "cart", label: "Add to Cart", icon: "🛒", desc: "Abandoned checkout recovery" },
          ] as { id: ShopifyTab; label: string; icon: string; desc: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveShopify(t.id)}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg border transition-all ${
              activeShopify === t.id
                ? "bg-[#1c2128] border-white/15 border-b-[#1c2128] text-white -mb-px"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeShopify === "cod" && <CODView />}
      {activeShopify === "cart" && <CartView />}
    </div>
  )
}

function CODView() {
  const rows = [
    { id: 1, order: "#1042", name: "Riya Sharma", phone: "98XXXXXX01", product: "Wireless Earbuds", amount: "₹1,299", status: "Confirmed", wa: "Sent", run: "RUN-881" },
    { id: 2, order: "#1043", name: "Arjun Mehta", phone: "97XXXXXX42", product: "Yoga Mat", amount: "₹799", status: "Pending", wa: "Pending", run: "RUN-882" },
    { id: 3, order: "#1044", name: "Sneha Nair", phone: "91XXXXXX77", product: "Face Serum", amount: "₹2,199", status: "Cancelled", wa: "Failed", run: "RUN-883" },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Total COD Orders" value="342" />
        <MiniStat label="Confirmed" value="218" color="text-emerald-400" />
        <MiniStat label="Pending" value="89" color="text-yellow-400" />
        <MiniStat label="Cancelled" value="35" color="text-red-400" />
      </div>

      <WireframeCard title="COD Orders — linked to Dograh RUN_ID" height="h-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                {["Order #", "Customer", "Phone", "Product", "Amount", "Status", "WA Status", "Run ID", "Actions"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2.5 px-2 text-orange-400 font-medium">{r.order}</td>
                  <td className="py-2.5 px-2">{r.name}</td>
                  <td className="py-2.5 px-2 text-white/50">{r.phone}</td>
                  <td className="py-2.5 px-2">{r.product}</td>
                  <td className="py-2.5 px-2 font-semibold">{r.amount}</td>
                  <td className="py-2.5 px-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-2.5 px-2">
                    <WaBadge status={r.wa} />
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="font-mono text-emerald-400/80 text-[10px]">{r.run}</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex gap-1">
                      <ActionBtn label="▶ Recording" color="emerald" />
                      <ActionBtn label="📄 Transcript" color="blue" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Run detail expand hint */}
        <div className="mt-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[10px] text-emerald-400 font-semibold mb-1.5 uppercase tracking-wider">
            Dograh Run Details (on row expand)
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-white/50">
            {["recording_url", "transcript_url", "user_recording_url", "bot_recording_url", "duration / cost_info", "gathered_context", "call_type (inbound/outbound)", "is_completed", "initial_context"].map((f) => (
              <div key={f} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                <span className="font-mono">{f}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-white/30">
            API: <span className="font-mono text-white/50">GET /api/v1/workflow/{"{workflow_id}"}/runs/{"{run_id}"}</span>
          </div>
        </div>
      </WireframeCard>
    </div>
  )
}

function CartView() {
  const rows = [
    { id: 1, token: "abc123", name: "Priya Kapoor", phone: "96XXXXXX10", product: "Running Shoes", qty: "1", amount: "₹3,499", date: "Jun 28" },
    { id: 2, token: "def456", name: "Rahul Verma", phone: "99XXXXXX34", product: "Protein Powder", qty: "2", amount: "₹2,598", date: "Jun 29" },
    { id: 3, token: "ghi789", name: "Anjali Iyer", phone: "90XXXXXX55", product: "Smartwatch", qty: "1", amount: "₹8,999", date: "Jun 30" },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Total Abandoned" value="891" />
        <MiniStat label="Recovered" value="204" color="text-emerald-400" />
        <MiniStat label="Recovery Rate" value="22.9%" color="text-blue-400" />
        <MiniStat label="Revenue Saved" value="₹4.2L" color="text-orange-400" />
      </div>

      <WireframeCard title="Abandoned Checkouts — E-commerce add to cart table" height="h-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                {["Token", "Customer", "Phone", "Product", "Qty", "Amount", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2.5 px-2 font-mono text-[10px] text-blue-400">{r.token}</td>
                  <td className="py-2.5 px-2">{r.name}</td>
                  <td className="py-2.5 px-2 text-white/50">{r.phone}</td>
                  <td className="py-2.5 px-2">{r.product}</td>
                  <td className="py-2.5 px-2 text-center">{r.qty}</td>
                  <td className="py-2.5 px-2 font-semibold">{r.amount}</td>
                  <td className="py-2.5 px-2 text-white/50">{r.date}</td>
                  <td className="py-2.5 px-2">
                    <div className="flex gap-1">
                      <ActionBtn label="📲 Send WA" color="green" />
                      <ActionBtn label="🔗 Checkout" color="orange" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
          <div className="text-[10px] text-blue-400 font-semibold mb-1 uppercase tracking-wider">Schema Fields Available</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/50 font-mono">
            {["checkout_token", "product_name", "variant", "sku", "quantity", "product_price", "total_amount", "shipping_charge", "tax", "address_line1", "city", "state", "pincode", "abandoned_checkout_url"].map((f) => (
              <span key={f} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-400/60" />{f}
              </span>
            ))}
          </div>
        </div>
      </WireframeCard>
    </div>
  )
}

/* ──────────────────────────────────────────────
   WHATSAPP TAB
─────────────────────────────────────────────── */
function WhatsAppTab() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1)
  const chats = [
    { id: 1, name: "Riya Sharma", phone: "+91 98xxxxxx01", last: "Your order has been confirmed!", time: "2m", unread: 2, tag: "COD" },
    { id: 2, name: "Arjun Mehta", phone: "+91 97xxxxxx42", last: "Can I change the address?", time: "15m", unread: 0, tag: "Support" },
    { id: 3, name: "Sneha Nair", phone: "+91 91xxxxxx77", last: "Please call me back.", time: "1h", unread: 1, tag: "Callback" },
    { id: 4, name: "Priya Kapoor", phone: "+91 96xxxxxx10", last: "Is this available in size 8?", time: "3h", unread: 0, tag: "Cart" },
    { id: 5, name: "Rahul Verma", phone: "+91 99xxxxxx34", last: "Order delivered. Thanks!", time: "5h", unread: 0, tag: "Delivered" },
  ]
  const messages = [
    { id: 1, dir: "in" as const, text: "Hi, I placed an order. When will it arrive?", time: "10:01" },
    { id: 2, dir: "out" as const, text: "Hello Riya! Your order #1042 is confirmed and will arrive in 3-5 days.", time: "10:02" },
    { id: 3, dir: "in" as const, text: "Great! Can you share the tracking link?", time: "10:03" },
    { id: 4, dir: "out" as const, text: "Sure! Here is your tracking link: track.shiprocket.com/abc123 📦", time: "10:04" },
    { id: 5, dir: "in" as const, text: "Your order has been confirmed!", time: "10:05" },
  ]

  return (
    <div className="p-6 space-y-5 h-full">
      <SectionHeader
        title="WhatsApp"
        subtitle="Live chat inbox powered by BotSailor API — subscribers, conversations, labels"
        badge="BotSailor"
        badgeColor="green"
      />

      <div className="grid grid-cols-3 gap-4" style={{ height: "calc(100vh - 200px)" }}>
        {/* Chat list */}
        <div className="col-span-1 border border-white/10 rounded-xl bg-[#161b22] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs text-white/30">Search conversations...</span>
            </div>
          </div>
          <div className="text-[10px] text-white/30 px-3 py-2 uppercase tracking-widest border-b border-white/5">
            BotSailor — Subscribers List
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChat(c.id)}
                className={`w-full text-left px-3 py-3 border-b border-white/5 flex gap-3 items-start hover:bg-white/5 transition-all ${selectedChat === c.id ? "bg-white/8" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{c.name}</span>
                    <span className="text-[10px] text-white/30 shrink-0 ml-1">{c.time}</span>
                  </div>
                  <div className="text-[11px] text-white/40 truncate mt-0.5">{c.last}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">{c.tag}</span>
                    {c.unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#25d366] text-[9px] font-bold flex items-center justify-center text-black">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-white/10 bg-[#25d366]/5">
            <div className="text-[10px] text-white/30 text-center">
              API: <span className="font-mono text-white/50">/api/v1/subscriber/list</span>
            </div>
          </div>
        </div>

        {/* Conversation pane */}
        <div className="col-span-2 border border-white/10 rounded-xl bg-[#161b22] flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-[#1c2128]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold">
                  {chats.find((c) => c.id === selectedChat)?.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{chats.find((c) => c.id === selectedChat)?.name}</div>
                  <div className="text-[10px] text-white/40">{chats.find((c) => c.id === selectedChat)?.phone}</div>
                </div>
                <div className="ml-auto flex gap-2">
                  <ActionBtn label="Assign Label" color="blue" />
                  <ActionBtn label="Add Note" color="gray" />
                  <ActionBtn label="View Profile" color="emerald" />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.dir === "out" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        m.dir === "out"
                          ? "bg-[#25d366] text-black rounded-br-none"
                          : "bg-white/10 text-white rounded-bl-none"
                      }`}
                    >
                      {m.text}
                      <div className={`text-[10px] mt-1 ${m.dir === "out" ? "text-black/50 text-right" : "text-white/40"}`}>
                        {m.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2 items-center bg-white/5 rounded-xl px-3 py-2.5">
                  <span className="text-xs text-white/30 flex-1">Type a message...</span>
                  <div className="flex gap-1.5">
                    <ActionBtn label="📎" color="gray" />
                    <ActionBtn label="Send ▶" color="green" />
                  </div>
                </div>
              </div>

              {/* Subscriber API fields hint */}
              <div className="mx-3 mb-3 p-2.5 rounded-lg border border-[#25d366]/20 bg-[#25d366]/5">
                <div className="text-[10px] text-[#25d366] font-semibold mb-1 uppercase tracking-wider">BotSailor Subscriber Fields</div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-white/40 font-mono">
                  {["subscriber_id", "name", "phone", "labels", "custom_fields", "sequences", "bot_flow", "last_message", "chat_history"].map((f) => (
                    <span key={f} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#25d366]/60" />{f}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   SHARED UI ATOMS
─────────────────────────────────────────────── */

function SectionHeader({
  title,
  subtitle,
  badge,
  badgeColor = "emerald",
}: {
  title: string
  subtitle: string
  badge?: string
  badgeColor?: string
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    green: "bg-[#25d366]/10 text-[#25d366] border-[#25d366]/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  }
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          {badge && (
            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${colors[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-white/40 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  delta,
  icon,
  color,
}: {
  label: string
  value: string
  delta: string
  icon: string
  color: string
}) {
  const borders: Record<string, string> = {
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
    orange: "border-orange-500/20 hover:border-orange-500/40",
    blue: "border-blue-500/20 hover:border-blue-500/40",
    green: "border-[#25d366]/20 hover:border-[#25d366]/40",
  }
  const texts: Record<string, string> = {
    emerald: "text-emerald-400",
    orange: "text-orange-400",
    blue: "text-blue-400",
    green: "text-[#25d366]",
  }
  return (
    <div className={`border rounded-xl bg-[#161b22] p-4 transition-all ${borders[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className={`text-[11px] mt-1 ${texts[color]}`}>{delta} vs last week</div>
    </div>
  )
}

function WireframeCard({
  title,
  children,
  height = "h-40",
  span,
}: {
  title: string
  children?: React.ReactNode
  height?: string
  span?: number
}) {
  return (
    <div
      className={`border border-white/10 rounded-xl bg-[#161b22] p-4 ${span ? `col-span-${span}` : ""}`}
    >
      <div className="text-xs font-medium text-white/60 mb-3">{title}</div>
      <div className={`${height} flex items-end justify-center`}>{children}</div>
    </div>
  )
}

function BarChartPlaceholder() {
  const bars = [40, 65, 50, 80, 60, 90, 75]
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return (
    <div className="w-full flex items-end justify-around gap-2 h-full pb-2">
      {bars.map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-md bg-emerald-500/40 border-t-2 border-emerald-500 transition-all"
            style={{ height: `${h}%` }}
          />
          <span className="text-[9px] text-white/30">{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

function FunnelPlaceholder() {
  const steps = [
    { label: "Visits", w: "w-full", color: "bg-blue-500/30 border-blue-500" },
    { label: "Add Cart", w: "w-4/5", color: "bg-orange-500/30 border-orange-500" },
    { label: "Checkout", w: "w-3/5", color: "bg-yellow-500/30 border-yellow-500" },
    { label: "COD Confirmed", w: "w-2/5", color: "bg-emerald-500/30 border-emerald-500" },
  ]
  return (
    <div className="w-full flex flex-col items-center justify-center gap-1.5 h-full">
      {steps.map((s) => (
        <div key={s.label} className={`${s.w} border-l-2 ${s.color} rounded px-2 py-1.5 text-[10px] text-white/60`}>
          {s.label}
        </div>
      ))}
    </div>
  )
}

function DonutPlaceholder() {
  return (
    <div className="flex items-center justify-center gap-4 h-full w-full">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1c2128" strokeWidth="3.8" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3.8" strokeDasharray="63 37" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f97316" strokeWidth="3.8" strokeDasharray="26 74" strokeDashoffset="-63" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3.8" strokeDasharray="11 89" strokeDashoffset="-89" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">342</div>
      </div>
      <div className="space-y-1.5 text-[10px]">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Confirmed 63%</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />Pending 26%</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Cancelled 11%</div>
      </div>
    </div>
  )
}

function HBarPlaceholder() {
  const agents = [
    { name: "Agent Alpha", val: 92 },
    { name: "Agent Beta", val: 78 },
    { name: "Agent Gamma", val: 85 },
    { name: "Agent Delta", val: 64 },
  ]
  return (
    <div className="w-full space-y-3 h-full flex flex-col justify-center">
      {agents.map((a) => (
        <div key={a.name} className="flex items-center gap-3">
          <span className="text-[10px] text-white/50 w-24 text-right shrink-0">{a.name}</span>
          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500/50 border-r-2 border-emerald-500 rounded-full"
              style={{ width: `${a.val}%` }}
            />
          </div>
          <span className="text-[10px] text-emerald-400 w-8 shrink-0">{a.val}%</span>
        </div>
      ))}
    </div>
  )
}

function SchemaCard({
  title,
  color,
  source,
  fields,
}: {
  title: string
  color: string
  source: string
  fields: { name: string; type: string; note: string }[]
}) {
  const colors: Record<string, { border: string; text: string; badge: string }> = {
    orange: { border: "border-orange-500/20", text: "text-orange-400", badge: "bg-orange-500/10 text-orange-300" },
    blue: { border: "border-blue-500/20", text: "text-blue-400", badge: "bg-blue-500/10 text-blue-300" },
  }
  const c = colors[color]
  return (
    <div className={`border ${c.border} rounded-xl bg-[#161b22] p-4`}>
      <div className={`text-xs font-semibold ${c.text} mb-0.5`}>{title}</div>
      <div className="text-[10px] text-white/30 mb-3 font-mono">{source}</div>
      <div className="space-y-1.5">
        {fields.map((f) => (
          <div key={f.name} className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${c.badge}`}>{f.name}</span>
            <span className="text-[9px] text-white/25 italic">{f.type}</span>
            <span className="text-[10px] text-white/40 ml-auto text-right">{f.note}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniStat({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="border border-white/10 rounded-lg bg-[#1c2128] px-3 py-2.5">
      <div className="text-[10px] text-white/40">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${color}`}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    Pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    Cancelled: "bg-red-500/15 text-red-400 border-red-500/25",
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${map[status] ?? "bg-white/10 text-white/50"}`}>
      {status}
    </span>
  )
}

function WaBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Sent: "text-[#25d366]",
    Pending: "text-yellow-400",
    Failed: "text-red-400",
  }
  return <span className={`text-[10px] font-medium ${map[status] ?? "text-white/40"}`}>{status}</span>
}

function ActionBtn({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
    orange: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20",
    green: "bg-[#25d366]/10 text-[#25d366] hover:bg-[#25d366]/20",
    gray: "bg-white/5 text-white/50 hover:bg-white/10",
  }
  return (
    <button className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${colors[color] ?? colors.gray}`}>
      {label}
    </button>
  )
}

function LegendItem({ color, label, sub }: { color: string; label: string; sub: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${color}`} />
      <div>
        <div className="text-[10px] text-white/60 font-medium">{label}</div>
        <div className="text-[9px] text-white/30">{sub}</div>
      </div>
    </div>
  )
}

/* ── SVG icons ── */
function OverviewIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
function ShopifyIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
}
function WAIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
