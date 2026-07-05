"use client"

import { useState } from "react"

type NavTab = "overview" | "calls" | "shopify" | "whatsapp" | "wallet" | "billing" | "profile"
type ShopifyTab = "cod" | "cart"

export default function DashboardBlueprint() {
  const [activeNav, setActiveNav] = useState<NavTab>("overview")
  const [activeShopify, setActiveShopify] = useState<ShopifyTab>("cod")
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">
      {/* ── TOP NAV ── */}
      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between bg-[#161b22] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide text-white">AI Dashboard</span>
          <span className="text-xs text-white/30 ml-1">Blueprint</span>
        </div>

        {/* Right header controls */}
        <div className="flex items-center gap-3">
          {/* Wallet balance chip */}
          <button
            onClick={() => setActiveNav("wallet")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-yellow-500/25 bg-yellow-500/8 hover:bg-yellow-500/15 transition-all"
          >
            <WalletIcon className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-semibold">₹842.50</span>
            <span className="text-[10px] text-yellow-400/60">tokens</span>
          </button>

          {/* Notification bell */}
          <button className="relative w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
            <BellIcon className="w-4 h-4 text-white/50" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">3</span>
          </button>

          {/* Source badges */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Dograh</span>
            <span className="text-[10px] px-2 py-1 rounded bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/20">BotSailor</span>
            <span className="text-[10px] px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">Supabase</span>
          </div>

          {/* Profile avatar */}
          <button
            onClick={() => setActiveNav("profile")}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold border-2 border-emerald-500/40 hover:border-emerald-400 transition-all"
          >
            A
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-56 border-r border-white/10 bg-[#161b22] flex flex-col py-4 shrink-0">
          <nav className="flex flex-col gap-1 px-3">
            {(
              [
                { id: "overview", label: "Overview", icon: OverviewIcon, desc: "Analytics & KPIs" },
                { id: "calls",    label: "Calls",    icon: PhoneIcon,   desc: "Dograh AI call runs" },
                { id: "shopify",  label: "Shopify",  icon: ShopifyIcon, desc: "COD · Add to Cart" },
                { id: "whatsapp", label: "WhatsApp", icon: WAIcon,      desc: "Chat conversations" },
              ] as { id: NavTab; label: string; icon: React.FC; desc: string }[]
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  activeNav === item.id
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <item.icon />
                <div>
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-[10px] text-white/40 leading-tight">{item.desc}</div>
                </div>
              </button>
            ))}

            {/* Divider */}
            <div className="my-2 border-t border-white/8" />

            {/* Bottom nav items */}
            {(
              [
                { id: "wallet",  label: "Wallet & Recharge", icon: WalletNavIcon, desc: "Tokens · Top-up" },
                { id: "billing", label: "Billing",           icon: BillingIcon,   desc: "Invoices · Plans" },
                { id: "profile", label: "Profile",           icon: ProfileIcon,   desc: "Account settings" },
              ] as { id: NavTab; label: string; icon: React.FC; desc: string }[]
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  activeNav === item.id
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
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

          {/* Data source legend */}
          <div className="mt-auto px-4 pb-2">
            <div className="text-[10px] text-white/25 uppercase tracking-widest mb-2">Data Sources</div>
            <div className="space-y-1.5">
              <LegendItem color="bg-emerald-500" label="Dograh API" sub="Runs · Recordings · Transcripts" />
              <LegendItem color="bg-[#25d366]"   label="BotSailor API" sub="Subscribers · Chat · Inbox" />
              <LegendItem color="bg-orange-400"  label="Supabase DB" sub="COD Orders · Add to Cart" />
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-[#0d1117]">
          {activeNav === "overview"  && <OverviewTab />}
          {activeNav === "calls"     && <CallsTab />}
          {activeNav === "shopify"   && (
            <ShopifyTab activeShopify={activeShopify} setActiveShopify={setActiveShopify} />
          )}
          {activeNav === "whatsapp"  && <WhatsAppTab />}
          {activeNav === "wallet"    && <WalletTab />}
          {activeNav === "billing"   && <BillingTab />}
          {activeNav === "profile"   && <ProfileTab />}
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
        subtitle="Aggregated analytics across Dograh AI calls, Shopify orders & WhatsApp conversations"
        badge="Live"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Calls"       value="1,284" delta="+12%" colorKey="emerald" icon={<PhoneIcon />} />
        <KpiCard label="COD Orders"        value="342"   delta="+8%"  colorKey="orange"  icon={<ShopifyIcon />} />
        <KpiCard label="Add to Carts"      value="891"   delta="+23%" colorKey="blue"    icon={<CartIcon />} />
        <KpiCard label="WA Conversations"  value="2,104" delta="+5%"  colorKey="green"   icon={<WAIcon />} />
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
            { name: "RUN_ID",         type: "integer", note: "→ Dograh Run ID" },
            { name: "order_number",   type: "text",    note: "Shopify order #" },
            { name: "payment_method", type: "text",    note: "COD / Prepaid" },
            { name: "order confirm",  type: "text",    note: "AI confirmed?" },
            { name: "recording_url",  type: "text",    note: "Dograh recording" },
            { name: "transcript_url", type: "text",    note: "Dograh transcript" },
            { name: "status",         type: "text",    note: "Order status" },
            { name: "WhatsApp Status",type: "text",    note: "WA delivery" },
          ]}
        />
        <SchemaCard
          title="Add to Cart Schema"
          color="blue"
          source="Supabase → E-commerce add to cart"
          fields={[
            { name: "checkout id",           type: "bigint",  note: "Primary key" },
            { name: "checkout_token",         type: "text",    note: "Shopify token" },
            { name: "customer_name",          type: "text",    note: "Buyer name" },
            { name: "product_name",           type: "text",    note: "Item" },
            { name: "quantity",               type: "text",    note: "Cart qty" },
            { name: "total_amount",           type: "numeric", note: "₹ value" },
            { name: "abandoned_checkout_url", type: "text",    note: "Recovery link" },
            { name: "phone / email",          type: "text",    note: "Contact info" },
          ]}
        />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   CALLS TAB  (Dograh API)
─────────────────────────────────────────────── */
function CallsTab() {
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType]     = useState("all")

  const runs = [
    { id: "RUN-881", workflow: "COD-Confirm", type: "outbound", status: "completed", customer: "Riya Sharma",  phone: "98XXXXXX01", duration: "2m 14s", cost: "₹1.20", date: "Today 10:02", recording: true, transcript: true },
    { id: "RUN-882", workflow: "COD-Confirm", type: "outbound", status: "completed", customer: "Arjun Mehta", phone: "97XXXXXX42", duration: "1m 45s", cost: "₹0.95", date: "Today 10:15", recording: true, transcript: true },
    { id: "RUN-883", workflow: "COD-Confirm", type: "outbound", status: "failed",    customer: "Sneha Nair",  phone: "91XXXXXX77", duration: "0m 22s", cost: "₹0.20", date: "Today 10:31", recording: false, transcript: false },
    { id: "RUN-884", workflow: "Cart-Recovery",type: "outbound",status: "completed", customer: "Priya Kapoor",phone: "96XXXXXX10", duration: "3m 05s", cost: "₹1.65", date: "Today 11:00", recording: true, transcript: true },
    { id: "RUN-885", workflow: "Cart-Recovery",type: "inbound", status: "completed", customer: "Rahul Verma", phone: "99XXXXXX34", duration: "4m 18s", cost: "₹2.30", date: "Today 11:22", recording: true, transcript: true },
    { id: "RUN-886", workflow: "COD-Confirm", type: "outbound", status: "no-answer", customer: "Kavya Singh",  phone: "88XXXXXX66", duration: "0m 30s", cost: "₹0.15", date: "Today 11:45", recording: false, transcript: false },
  ]

  const filtered = runs.filter(r =>
    (filterStatus === "all" || r.status === filterStatus) &&
    (filterType   === "all" || r.type   === filterType)
  )

  return (
    <div className="p-6 space-y-5">
      <SectionHeader
        title="Calls"
        subtitle="All Dograh AI call runs — recordings, transcripts, gathered context per run"
        badge="Dograh API"
      />

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        <MiniStat label="Total Runs"    value="1,284" />
        <MiniStat label="Completed"     value="1,102" color="text-emerald-400" />
        <MiniStat label="Failed"        value="98"    color="text-red-400" />
        <MiniStat label="No Answer"     value="84"    color="text-yellow-400" />
        <MiniStat label="Avg Duration"  value="2m 18s" color="text-blue-400" />
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#161b22] border border-white/10 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <svg className="w-3.5 h-3.5 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs text-white/30">Search by Run ID, customer, phone...</span>
        </div>

        <div className="flex items-center gap-1.5">
          {["all","completed","failed","no-answer"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-all capitalize ${
                filterStatus === s
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                  : "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              {s === "all" ? "All Status" : s.replace("-", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {["all","outbound","inbound"].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-all capitalize ${
                filterType === t
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                  : "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>

        <button className="ml-auto text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white/80 transition-all flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Runs table */}
      <div className="border border-white/10 rounded-xl bg-[#161b22] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-medium text-white/70">
            {filtered.length} runs — <span className="font-mono text-[10px] text-white/40">GET /api/v1/workflow/{"{id}"}/runs</span>
          </span>
          <span className="text-[10px] text-white/30">Showing {filtered.length} of {runs.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                {["Run ID","Workflow","Type","Customer","Phone","Duration","Cost","Date","Status","Actions"].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <>
                  <tr
                    key={r.id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                    onClick={() => setExpandedRun(expandedRun === r.id ? null : r.id)}
                  >
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-emerald-400 text-[10px] font-semibold">{r.id}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/60">{r.workflow}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <CallTypeBadge type={r.type} />
                    </td>
                    <td className="py-2.5 px-3 font-medium">{r.customer}</td>
                    <td className="py-2.5 px-3 text-white/50">{r.phone}</td>
                    <td className="py-2.5 px-3 text-white/70">{r.duration}</td>
                    <td className="py-2.5 px-3 text-yellow-400 font-medium">{r.cost}</td>
                    <td className="py-2.5 px-3 text-white/40 whitespace-nowrap">{r.date}</td>
                    <td className="py-2.5 px-3"><RunStatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1">
                        {r.recording  && <ActionBtn label="Recording"   color="emerald" />}
                        {r.transcript && <ActionBtn label="Transcript"  color="blue" />}
                        <ActionBtn label="Details" color="gray" />
                      </div>
                    </td>
                  </tr>
                  {/* Expanded run detail row */}
                  {expandedRun === r.id && (
                    <tr key={`${r.id}-expand`} className="bg-[#1c2128]">
                      <td colSpan={10} className="px-4 pb-4 pt-2">
                        <RunDetailExpanded run={r} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-white/30">Page 1 of 12</span>
          <div className="flex gap-1">
            {["Prev","1","2","3","...","12","Next"].map(p => (
              <button key={p} className={`text-[10px] px-2 py-1 rounded border transition-all ${p === "1" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "border-white/10 text-white/40 hover:text-white/70"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RunDetailExpanded({ run }: { run: { id: string; workflow: string; status: string; duration: string; cost: string } }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/3 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-emerald-400">
          Run Detail — <span className="font-mono">{run.id}</span>
        </div>
        <span className="text-[10px] font-mono text-white/30">GET /api/v1/workflow/{"{id}"}/runs/{"{run_id}"}</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Recording",       value: "▶ Play (user_recording_url)", color: "text-emerald-400" },
          { label: "Bot Recording",   value: "▶ Play (bot_recording_url)",  color: "text-emerald-400" },
          { label: "Transcript",      value: "View Full Transcript",         color: "text-blue-400" },
          { label: "Call Type",       value: run.workflow,                   color: "text-white/70" },
          { label: "Duration",        value: run.duration,                   color: "text-white/70" },
          { label: "Cost Info",       value: run.cost,                       color: "text-yellow-400" },
          { label: "Is Completed",    value: run.status === "completed" ? "Yes" : "No", color: run.status === "completed" ? "text-emerald-400" : "text-red-400" },
          { label: "Inbound/Outbound",value: "outbound",                     color: "text-white/70" },
        ].map(f => (
          <div key={f.label} className="bg-[#0d1117] rounded-lg p-2.5">
            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">{f.label}</div>
            <div className={`text-[11px] font-medium ${f.color}`}>{f.value}</div>
          </div>
        ))}
      </div>

      {/* Gathered context */}
      <div className="bg-[#0d1117] rounded-lg p-3">
        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">gathered_context (from Dograh)</div>
        <div className="flex flex-wrap gap-2">
          {["customer_intent", "order_status", "address_confirmed", "payment_preference", "callback_requested", "sentiment"].map(k => (
            <div key={k} className="flex items-center gap-1.5 bg-[#161b22] border border-white/10 rounded-md px-2 py-1">
              <span className="text-[9px] text-white/40 font-mono">{k}:</span>
              <span className="text-[9px] text-emerald-400 font-medium">...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Initial context */}
      <div className="bg-[#0d1117] rounded-lg p-3">
        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">initial_context (sent to Dograh)</div>
        <div className="flex flex-wrap gap-2">
          {["customer_name", "order_id", "product_name", "amount", "address", "phone"].map(k => (
            <div key={k} className="flex items-center gap-1.5 bg-[#161b22] border border-white/10 rounded-md px-2 py-1">
              <span className="text-[9px] text-white/40 font-mono">{k}:</span>
              <span className="text-[9px] text-blue-400 font-medium">...</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   SHOPIFY TAB
─────────────────────────────────────────────── */
function ShopifyTab({ activeShopify, setActiveShopify }: { activeShopify: ShopifyTab; setActiveShopify: (t: ShopifyTab) => void }) {
  return (
    <div className="p-6 space-y-5">
      <SectionHeader
        title="Shopify"
        subtitle="Manage COD confirmations & abandoned cart recovery powered by Dograh AI calls"
        badge="Shopify"
        badgeColor="orange"
      />

      <div className="flex gap-2 border-b border-white/10">
        {(
          [
            { id: "cod",  label: "COD Confirmation", desc: "AI call confirms Cash-on-Delivery orders" },
            { id: "cart", label: "Add to Cart",       desc: "Abandoned checkout recovery" },
          ] as { id: ShopifyTab; label: string; desc: string }[]
        ).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveShopify(t.id)}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg border transition-all ${
              activeShopify === t.id
                ? "bg-[#161b22] border-white/15 border-b-[#161b22] text-white -mb-px"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeShopify === "cod"  && <CODView />}
      {activeShopify === "cart" && <CartView />}
    </div>
  )
}

function CODView() {
  const rows = [
    { id: 1, order: "#1042", name: "Riya Sharma",  phone: "98XXXXXX01", product: "Wireless Earbuds", amount: "₹1,299", status: "Confirmed", wa: "Sent",    run: "RUN-881" },
    { id: 2, order: "#1043", name: "Arjun Mehta",  phone: "97XXXXXX42", product: "Yoga Mat",         amount: "₹799",  status: "Pending",   wa: "Pending", run: "RUN-882" },
    { id: 3, order: "#1044", name: "Sneha Nair",   phone: "91XXXXXX77", product: "Face Serum",       amount: "₹2,199",status: "Cancelled", wa: "Failed",  run: "RUN-883" },
    { id: 4, order: "#1045", name: "Kavya Singh",  phone: "88XXXXXX66", product: "Protein Powder",   amount: "₹1,899",status: "Confirmed", wa: "Sent",    run: "RUN-884" },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Total COD Orders" value="342" />
        <MiniStat label="Confirmed"  value="218" color="text-emerald-400" />
        <MiniStat label="Pending"    value="89"  color="text-yellow-400" />
        <MiniStat label="Cancelled"  value="35"  color="text-red-400" />
      </div>

      <div className="border border-white/10 rounded-xl bg-[#161b22] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 text-xs text-white/50 font-medium">
          COD Orders — linked to Dograh RUN_ID
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                {["Order #","Customer","Phone","Product","Amount","Status","WA Status","Run ID","Actions"].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2.5 px-3 text-orange-400 font-medium">{r.order}</td>
                  <td className="py-2.5 px-3">{r.name}</td>
                  <td className="py-2.5 px-3 text-white/50">{r.phone}</td>
                  <td className="py-2.5 px-3">{r.product}</td>
                  <td className="py-2.5 px-3 font-semibold">{r.amount}</td>
                  <td className="py-2.5 px-3"><StatusBadge status={r.status} /></td>
                  <td className="py-2.5 px-3"><WaBadge status={r.wa} /></td>
                  <td className="py-2.5 px-3"><span className="font-mono text-emerald-400/80 text-[10px]">{r.run}</span></td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1">
                      <ActionBtn label="Recording"  color="emerald" />
                      <ActionBtn label="Transcript" color="blue" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <div className="text-[10px] text-emerald-400 font-semibold mb-2 uppercase tracking-wider">
          Dograh Run fields per row (on expand)
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-[10px] text-white/50 font-mono">
          {["recording_url","transcript_url","user_recording_url","bot_recording_url","duration","cost_info","gathered_context","call_type","is_completed","initial_context"].map(f => (
            <div key={f} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CartView() {
  const rows = [
    { id: 1, token: "abc123", name: "Priya Kapoor", phone: "96XXXXXX10", product: "Running Shoes",  qty: "1", amount: "₹3,499", date: "Jun 28" },
    { id: 2, token: "def456", name: "Rahul Verma",  phone: "99XXXXXX34", product: "Protein Powder", qty: "2", amount: "₹2,598", date: "Jun 29" },
    { id: 3, token: "ghi789", name: "Anjali Iyer",  phone: "90XXXXXX55", product: "Smartwatch",     qty: "1", amount: "₹8,999", date: "Jun 30" },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Total Abandoned" value="891" />
        <MiniStat label="Recovered"       value="204"    color="text-emerald-400" />
        <MiniStat label="Recovery Rate"   value="22.9%"  color="text-blue-400" />
        <MiniStat label="Revenue Saved"   value="₹4.2L"  color="text-orange-400" />
      </div>

      <div className="border border-white/10 rounded-xl bg-[#161b22] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 text-xs text-white/50 font-medium">
          Abandoned Checkouts — E-commerce add to cart table
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                {["Token","Customer","Phone","Product","Qty","Amount","Date","Actions"].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[10px] text-blue-400">{r.token}</td>
                  <td className="py-2.5 px-3">{r.name}</td>
                  <td className="py-2.5 px-3 text-white/50">{r.phone}</td>
                  <td className="py-2.5 px-3">{r.product}</td>
                  <td className="py-2.5 px-3 text-center">{r.qty}</td>
                  <td className="py-2.5 px-3 font-semibold">{r.amount}</td>
                  <td className="py-2.5 px-3 text-white/50">{r.date}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1">
                      <ActionBtn label="Send WA"  color="green" />
                      <ActionBtn label="Checkout" color="orange" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   WHATSAPP TAB
─────────────────────────────────────────────── */
function WhatsAppTab() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1)
  const chats = [
    { id: 1, name: "Riya Sharma",  phone: "+91 98xxxxxx01", last: "Your order has been confirmed!", time: "2m",  unread: 2, tag: "COD" },
    { id: 2, name: "Arjun Mehta", phone: "+91 97xxxxxx42", last: "Can I change the address?",      time: "15m", unread: 0, tag: "Support" },
    { id: 3, name: "Sneha Nair",  phone: "+91 91xxxxxx77", last: "Please call me back.",           time: "1h",  unread: 1, tag: "Callback" },
    { id: 4, name: "Priya Kapoor",phone: "+91 96xxxxxx10", last: "Is this available in size 8?",  time: "3h",  unread: 0, tag: "Cart" },
    { id: 5, name: "Rahul Verma", phone: "+91 99xxxxxx34", last: "Order delivered. Thanks!",       time: "5h",  unread: 0, tag: "Delivered" },
  ]
  const messages = [
    { id: 1, dir: "in"  as const, text: "Hi, I placed an order. When will it arrive?",                             time: "10:01" },
    { id: 2, dir: "out" as const, text: "Hello Riya! Your order #1042 is confirmed and will arrive in 3-5 days.", time: "10:02" },
    { id: 3, dir: "in"  as const, text: "Great! Can you share the tracking link?",                                  time: "10:03" },
    { id: 4, dir: "out" as const, text: "Sure! Here is your tracking link: track.shiprocket.com/abc123",           time: "10:04" },
    { id: 5, dir: "in"  as const, text: "Your order has been confirmed!",                                           time: "10:05" },
  ]

  return (
    <div className="p-6 space-y-5">
      <SectionHeader
        title="WhatsApp"
        subtitle="Live chat inbox powered by BotSailor API — subscribers, conversations, labels"
        badge="BotSailor"
        badgeColor="green"
      />

      <div className="grid grid-cols-3 gap-4" style={{ height: "calc(100vh - 230px)" }}>
        {/* Chat list */}
        <div className="col-span-1 border border-white/10 rounded-xl bg-[#161b22] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs text-white/30">Search conversations...</span>
            </div>
          </div>
          <div className="text-[10px] text-white/25 px-3 py-2 uppercase tracking-widest border-b border-white/5">
            BotSailor Subscribers
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChat(c.id)}
                className={`w-full text-left px-3 py-3 border-b border-white/5 flex gap-3 items-start hover:bg-white/5 transition-all ${selectedChat === c.id ? "bg-white/8 border-l-2 border-l-[#25d366]" : ""}`}
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
            <div className="text-[10px] text-white/30 text-center font-mono">/api/v1/subscriber/list</div>
          </div>
        </div>

        {/* Conversation pane */}
        <div className="col-span-2 border border-white/10 rounded-xl bg-[#161b22] flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-[#1c2128]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold">
                  {chats.find(c => c.id === selectedChat)?.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{chats.find(c => c.id === selectedChat)?.name}</div>
                  <div className="text-[10px] text-white/40">{chats.find(c => c.id === selectedChat)?.phone}</div>
                </div>
                <div className="ml-auto flex gap-1.5">
                  <ActionBtn label="Assign Label" color="blue" />
                  <ActionBtn label="Add Note"     color="gray" />
                  <ActionBtn label="View Profile" color="emerald" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.dir === "out" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      m.dir === "out"
                        ? "bg-[#25d366] text-black rounded-br-none"
                        : "bg-white/10 text-white rounded-bl-none"
                    }`}>
                      {m.text}
                      <div className={`text-[10px] mt-1 ${m.dir === "out" ? "text-black/50 text-right" : "text-white/40"}`}>
                        {m.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2 items-center bg-white/5 rounded-xl px-3 py-2.5">
                  <span className="text-xs text-white/30 flex-1">Type a message...</span>
                  <div className="flex gap-1.5">
                    <ActionBtn label="Attach" color="gray" />
                    <ActionBtn label="Send"   color="green" />
                  </div>
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
   WALLET & RECHARGE TAB
─────────────────────────────────────────────── */
function WalletTab() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500)
  const amounts = [100, 250, 500, 1000, 2000, 5000]

  const txns = [
    { id: "TXN-001", type: "Recharge",  amount: "+₹500",   date: "Jun 30, 2026", method: "UPI",         status: "Success",  balance: "₹842.50" },
    { id: "TXN-002", type: "Call Cost", amount: "-₹1.20",  date: "Jun 30, 2026", method: "Dograh API",  status: "Deducted", balance: "₹342.50" },
    { id: "TXN-003", type: "Call Cost", amount: "-₹0.95",  date: "Jun 29, 2026", method: "Dograh API",  status: "Deducted", balance: "₹343.70" },
    { id: "TXN-004", type: "Recharge",  amount: "+₹250",   date: "Jun 28, 2026", method: "Credit Card", status: "Success",  balance: "₹344.65" },
    { id: "TXN-005", type: "Call Cost", amount: "-₹2.30",  date: "Jun 28, 2026", method: "Dograh API",  status: "Deducted", balance: "₹94.65"  },
  ]

  return (
    <div className="p-6 space-y-6">
      <SectionHeader
        title="Wallet & Recharge"
        subtitle="Manage your token balance, top-up credits, and view transaction history"
        badge="Tokens"
        badgeColor="yellow"
      />

      {/* Balance + Recharge side by side */}
      <div className="grid grid-cols-3 gap-5">
        {/* Current balance */}
        <div className="col-span-1 border border-yellow-500/25 rounded-xl bg-[#161b22] p-5 space-y-4">
          <div className="text-xs text-white/50 uppercase tracking-wider">Current Balance</div>
          <div className="space-y-1">
            <div className="text-4xl font-bold text-yellow-400">₹842.50</div>
            <div className="text-[11px] text-white/30">≈ 842 tokens remaining</div>
          </div>

          {/* Usage ring */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1c2128" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eab308" strokeWidth="3.5" strokeDasharray="62 38" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-yellow-400">62%</div>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="text-white/50">Spent this month</div>
              <div className="text-red-400 font-semibold">₹517.50</div>
              <div className="text-white/30">of ₹1,360 loaded</div>
            </div>
          </div>

          {/* Low balance warning */}
          <div className="p-2.5 rounded-lg border border-yellow-500/25 bg-yellow-500/8 text-[10px] text-yellow-400">
            Low balance alert is set at ₹100. You will be notified when balance falls below this.
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#1c2128] rounded-lg p-2.5 text-center">
              <div className="text-[9px] text-white/30 mb-0.5">Total Calls</div>
              <div className="text-sm font-bold text-white">1,284</div>
            </div>
            <div className="bg-[#1c2128] rounded-lg p-2.5 text-center">
              <div className="text-[9px] text-white/30 mb-0.5">Avg/Call</div>
              <div className="text-sm font-bold text-white">₹0.40</div>
            </div>
          </div>
        </div>

        {/* Recharge panel */}
        <div className="col-span-2 border border-white/10 rounded-xl bg-[#161b22] p-5 space-y-4">
          <div className="text-xs font-semibold text-white/70">Add Money to Wallet</div>

          {/* Quick amounts */}
          <div>
            <div className="text-[10px] text-white/40 mb-2">Select amount</div>
            <div className="grid grid-cols-3 gap-2">
              {amounts.map(a => (
                <button
                  key={a}
                  onClick={() => setSelectedAmount(a)}
                  className={`py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    selectedAmount === a
                      ? "border-yellow-500/50 bg-yellow-500/15 text-yellow-400"
                      : "border-white/10 bg-white/3 text-white/60 hover:border-white/25 hover:text-white/90"
                  }`}
                >
                  ₹{a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <div className="text-[10px] text-white/40 mb-2">Or enter custom amount</div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 flex-1">
                <span className="text-white/50 text-sm">₹</span>
                <span className="text-xs text-white/30">Enter amount (min ₹50)</span>
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <div>
            <div className="text-[10px] text-white/40 mb-2">Payment method</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "UPI",         sub: "GPay, PhonePe" },
                { label: "Credit Card", sub: "Visa, Mastercard" },
                { label: "Net Banking", sub: "All major banks" },
              ].map((m, i) => (
                <button key={m.label} className={`p-2.5 rounded-lg border text-left transition-all ${i === 0 ? "border-emerald-500/30 bg-emerald-500/8 text-white" : "border-white/10 bg-white/3 text-white/60 hover:border-white/20"}`}>
                  <div className="text-[11px] font-medium">{m.label}</div>
                  <div className="text-[9px] text-white/30 mt-0.5">{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary + Pay button */}
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-white/40">You pay</div>
              <div className="text-xl font-bold text-white">₹{(selectedAmount ?? 0).toLocaleString()}</div>
              <div className="text-[10px] text-white/30">+GST included · Instant credit</div>
            </div>
            <button className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold rounded-lg transition-all">
              Recharge Now
            </button>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="border border-white/10 rounded-xl bg-[#161b22] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-medium text-white/70">Transaction History</span>
          <button className="text-[10px] text-white/40 hover:text-white/70 transition-all flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Statement
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                {["Transaction ID","Type","Amount","Date","Method","Status","Balance After"].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[10px] text-white/50">{t.id}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${t.type === "Recharge" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`py-2.5 px-3 font-bold ${t.amount.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{t.amount}</td>
                  <td className="py-2.5 px-3 text-white/50">{t.date}</td>
                  <td className="py-2.5 px-3 text-white/60">{t.method}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-medium ${t.status === "Success" ? "text-emerald-400" : "text-white/50"}`}>{t.status}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-yellow-400/80 text-[10px]">{t.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   BILLING TAB
─────────────────────────────────────────────── */
function BillingTab() {
  const invoices = [
    { id: "INV-2026-06", period: "June 2026",  amount: "₹517.50", calls: 412, status: "Paid",    date: "Jul 1, 2026"  },
    { id: "INV-2026-05", period: "May 2026",   amount: "₹389.20", calls: 310, status: "Paid",    date: "Jun 1, 2026"  },
    { id: "INV-2026-04", period: "April 2026", amount: "₹624.80", calls: 498, status: "Paid",    date: "May 1, 2026"  },
    { id: "INV-2026-03", period: "March 2026", amount: "₹210.00", calls: 168, status: "Paid",    date: "Apr 1, 2026"  },
  ]

  return (
    <div className="p-6 space-y-6">
      <SectionHeader
        title="Billing"
        subtitle="Your subscription plan, usage-based charges, and invoice history"
        badge="Billing"
        badgeColor="blue"
      />

      {/* Current plan */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 border border-emerald-500/25 rounded-xl bg-[#161b22] p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Current Plan</div>
              <div className="text-lg font-bold text-white">Growth</div>
              <div className="text-xs text-white/40 mt-0.5">Billed monthly · Renews Aug 1, 2026</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">₹2,999<span className="text-sm font-normal text-white/40">/mo</span></div>
              <button className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-all mt-1">Upgrade Plan</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Calls Included",   used: "1,284", total: "5,000", pct: 25 },
              { label: "WA Messages",      used: "2,104", total: "10,000", pct: 21 },
              { label: "Workflows",        used: "3",     total: "10",    pct: 30 },
            ].map(m => (
              <div key={m.label} className="bg-[#1c2128] rounded-lg p-3">
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-white/50">{m.label}</span>
                  <span className="text-white/70">{m.used}/{m.total}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.pct}%` }} />
                </div>
                <div className="text-[9px] text-white/30 mt-1">{m.pct}% used</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan comparison */}
        <div className="border border-white/10 rounded-xl bg-[#161b22] p-5 space-y-3">
          <div className="text-xs font-semibold text-white/70">Available Plans</div>
          {[
            { name: "Starter", price: "₹999/mo",  calls: "1,000", active: false },
            { name: "Growth",  price: "₹2,999/mo", calls: "5,000", active: true  },
            { name: "Scale",   price: "₹7,999/mo", calls: "20,000",active: false },
          ].map(p => (
            <div key={p.name} className={`p-3 rounded-lg border transition-all ${p.active ? "border-emerald-500/40 bg-emerald-500/8" : "border-white/8 bg-white/3"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-xs font-semibold ${p.active ? "text-emerald-400" : "text-white/70"}`}>{p.name}</div>
                  <div className="text-[10px] text-white/30">{p.calls} calls/mo</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{p.price}</div>
                  {p.active && <span className="text-[9px] text-emerald-400">Current</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice table */}
      <div className="border border-white/10 rounded-xl bg-[#161b22] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 text-xs font-medium text-white/70">Invoice History</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                {["Invoice ID","Period","Calls","Amount","Date","Status",""].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[10px] text-blue-400">{inv.id}</td>
                  <td className="py-2.5 px-3">{inv.period}</td>
                  <td className="py-2.5 px-3 text-white/60">{inv.calls}</td>
                  <td className="py-2.5 px-3 font-semibold">{inv.amount}</td>
                  <td className="py-2.5 px-3 text-white/50">{inv.date}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium">{inv.status}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <ActionBtn label="Download PDF" color="gray" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment method on file */}
      <div className="border border-white/10 rounded-xl bg-[#161b22] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-white/70">Payment Method on File</span>
          <ActionBtn label="Update Card" color="blue" />
        </div>
        <div className="flex items-center gap-3 p-3 bg-[#1c2128] rounded-lg border border-white/8">
          <div className="w-10 h-7 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-[9px] font-bold text-white">VISA</div>
          <div>
            <div className="text-xs text-white/80">Visa ending in 4242</div>
            <div className="text-[10px] text-white/40">Expires 08/28</div>
          </div>
          <span className="ml-auto text-[10px] text-emerald-400">Default</span>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   PROFILE TAB
─────────────────────────────────────────────── */
function ProfileTab() {
  const [activeSection, setActiveSection] = useState("account")
  const sections = [
    { id: "account",     label: "Account" },
    { id: "integrations",label: "Integrations" },
    { id: "security",    label: "Security" },
    { id: "notifications",label: "Notifications" },
    { id: "team",        label: "Team" },
  ]

  return (
    <div className="p-6 space-y-5">
      <SectionHeader
        title="Profile & Settings"
        subtitle="Manage your account, integrations, API keys, and team members"
        badge="Settings"
        badgeColor="blue"
      />

      <div className="grid grid-cols-4 gap-5">
        {/* Section nav */}
        <div className="col-span-1">
          <nav className="flex flex-col gap-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeSection === s.id
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Section content */}
        <div className="col-span-3 space-y-5">
          {activeSection === "account" && (
            <div className="space-y-4">
              {/* Avatar + name */}
              <div className="border border-white/10 rounded-xl bg-[#161b22] p-5">
                <div className="text-xs font-semibold text-white/70 mb-4">Profile Information</div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold border-2 border-emerald-500/40">A</div>
                  <div>
                    <div className="text-sm font-semibold text-white">Abhishek Kumar</div>
                    <div className="text-xs text-white/40">abhishek@example.com</div>
                    <button className="text-[10px] text-emerald-400 hover:text-emerald-300 mt-1 transition-all">Change Avatar</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Full Name",     value: "Abhishek Kumar",         type: "text" },
                    { label: "Email Address", value: "abhishek@example.com",   type: "email" },
                    { label: "Phone Number",  value: "+91 98XXXXXXXX",         type: "tel" },
                    { label: "Company",       value: "My Store Pvt Ltd",       type: "text" },
                    { label: "Timezone",      value: "Asia/Kolkata (IST +5:30)", type: "text" },
                    { label: "Language",      value: "English (India)",        type: "text" },
                  ].map(f => (
                    <div key={f.label}>
                      <div className="text-[10px] text-white/40 mb-1">{f.label}</div>
                      <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70">{f.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "integrations" && (
            <div className="border border-white/10 rounded-xl bg-[#161b22] p-5 space-y-4">
              <div className="text-xs font-semibold text-white/70">Connected Integrations</div>
              {[
                { name: "Dograh AI",   desc: "AI voice call automation",   key: "dg_sk_••••••••••••ab12", status: "connected",    color: "emerald" },
                { name: "BotSailor",  desc: "WhatsApp CRM & messaging",    key: "bs_••••••••••••cd34",    status: "connected",    color: "green" },
                { name: "Supabase",   desc: "PostgreSQL database",         key: "sbp_••••••••••••ef56",   status: "connected",    color: "orange" },
                { name: "Shopify",    desc: "E-commerce store",            key: "shpat_••••••••••••gh78", status: "connected",    color: "blue" },
                { name: "Razorpay",   desc: "Payment gateway",             key: "Not connected",          status: "disconnected", color: "red" },
              ].map(int => (
                <div key={int.name} className="flex items-center gap-4 p-3 bg-[#1c2128] rounded-lg border border-white/8">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    int.color === "emerald" ? "bg-emerald-500/20 text-emerald-400" :
                    int.color === "green"   ? "bg-[#25d366]/20 text-[#25d366]" :
                    int.color === "orange"  ? "bg-orange-500/20 text-orange-400" :
                    int.color === "blue"    ? "bg-blue-500/20 text-blue-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {int.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white">{int.name}</div>
                    <div className="text-[10px] text-white/40">{int.desc}</div>
                  </div>
                  <div className="font-mono text-[10px] text-white/30">{int.key}</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${int.status === "connected" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span className={`text-[10px] ${int.status === "connected" ? "text-emerald-400" : "text-red-400"}`}>{int.status}</span>
                  </div>
                  <ActionBtn label={int.status === "connected" ? "Manage" : "Connect"} color={int.status === "connected" ? "gray" : "emerald"} />
                </div>
              ))}
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-4">
              <div className="border border-white/10 rounded-xl bg-[#161b22] p-5 space-y-4">
                <div className="text-xs font-semibold text-white/70">Password & Security</div>
                {["Current Password","New Password","Confirm New Password"].map(f => (
                  <div key={f}>
                    <div className="text-[10px] text-white/40 mb-1">{f}</div>
                    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/30">••••••••••</div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-4 rounded-full bg-emerald-500 relative cursor-pointer">
                      <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                    </div>
                    <span className="text-xs text-white/60">Two-Factor Authentication (enabled)</span>
                  </div>
                  <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-all">Update Password</button>
                </div>
              </div>

              <div className="border border-white/10 rounded-xl bg-[#161b22] p-5">
                <div className="text-xs font-semibold text-white/70 mb-3">API Keys</div>
                {[
                  { label: "Dograh API Key",   value: "dg_sk_••••••••••••ab12" },
                  { label: "BotSailor API Key", value: "bs_••••••••••••cd34"   },
                ].map(k => (
                  <div key={k.label} className="flex items-center gap-3 mb-2 p-2.5 bg-[#1c2128] rounded-lg border border-white/8">
                    <div className="flex-1">
                      <div className="text-[10px] text-white/40">{k.label}</div>
                      <div className="font-mono text-xs text-white/60 mt-0.5">{k.value}</div>
                    </div>
                    <ActionBtn label="Reveal" color="gray" />
                    <ActionBtn label="Regenerate" color="blue" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="border border-white/10 rounded-xl bg-[#161b22] p-5 space-y-4">
              <div className="text-xs font-semibold text-white/70">Notification Preferences</div>
              {[
                { label: "Low wallet balance alert",        sub: "Alert when balance drops below ₹100",   on: true },
                { label: "Call failure alerts",             sub: "Notify when a run fails or gets no answer", on: true },
                { label: "New COD order",                   sub: "Notify when Shopify COD webhook triggers",  on: true },
                { label: "Abandoned cart recovery",        sub: "Notify when cart recovery message is sent",  on: false },
                { label: "WhatsApp incoming message",       sub: "Desktop notification for new WA messages",  on: true },
                { label: "Weekly summary report",          sub: "Email every Monday with usage stats",        on: false },
              ].map(n => (
                <div key={n.label} className="flex items-center gap-4 p-3 bg-[#1c2128] rounded-lg border border-white/8">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white/80">{n.label}</div>
                    <div className="text-[10px] text-white/40">{n.sub}</div>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${n.on ? "bg-emerald-500" : "bg-white/15"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${n.on ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "team" && (
            <div className="border border-white/10 rounded-xl bg-[#161b22] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white/70">Team Members</div>
                <button className="text-[10px] px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all">Invite Member</button>
              </div>
              {[
                { name: "Abhishek Kumar", email: "abhishek@example.com", role: "Owner",  status: "Active" },
                { name: "Priya Sharma",  email: "priya@example.com",     role: "Admin",  status: "Active" },
                { name: "Raj Patel",     email: "raj@example.com",       role: "Viewer", status: "Invited" },
              ].map(m => (
                <div key={m.email} className="flex items-center gap-3 p-3 bg-[#1c2128] rounded-lg border border-white/8">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {m.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white/80">{m.name}</div>
                    <div className="text-[10px] text-white/40">{m.email}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-white/15 text-white/50">{m.role}</span>
                  <span className={`text-[10px] font-medium ${m.status === "Active" ? "text-emerald-400" : "text-yellow-400"}`}>{m.status}</span>
                  {m.role !== "Owner" && <ActionBtn label="Remove" color="gray" />}
                </div>
              ))}
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
  title, subtitle, badge, badgeColor = "emerald",
}: {
  title: string; subtitle: string; badge?: string; badgeColor?: string
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    orange:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
    green:   "bg-[#25d366]/10 text-[#25d366] border-[#25d366]/20",
    blue:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    yellow:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  }
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-lg font-semibold text-balance">{title}</h1>
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

function KpiCard({ label, value, delta, colorKey, icon }: {
  label: string; value: string; delta: string; colorKey: string; icon: React.ReactNode
}) {
  const borders: Record<string, string> = {
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
    orange:  "border-orange-500/20 hover:border-orange-500/40",
    blue:    "border-blue-500/20 hover:border-blue-500/40",
    green:   "border-[#25d366]/20 hover:border-[#25d366]/40",
  }
  const texts: Record<string, string> = {
    emerald: "text-emerald-400", orange: "text-orange-400", blue: "text-blue-400", green: "text-[#25d366]",
  }
  const iconBg: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400", orange: "bg-orange-500/10 text-orange-400",
    blue: "bg-blue-500/10 text-blue-400", green: "bg-[#25d366]/10 text-[#25d366]",
  }
  return (
    <div className={`border rounded-xl bg-[#161b22] p-4 transition-all ${borders[colorKey]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-white/40 uppercase tracking-wider leading-tight text-pretty">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg[colorKey]}`}>
          <div className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</div>
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className={`text-[11px] mt-1 ${texts[colorKey]}`}>{delta} vs last week</div>
    </div>
  )
}

function WireframeCard({ title, children, height = "h-40", span }: {
  title: string; children?: React.ReactNode; height?: string; span?: number
}) {
  return (
    <div className={`border border-white/10 rounded-xl bg-[#161b22] p-4 ${span ? `col-span-${span}` : ""}`}>
      <div className="text-xs font-medium text-white/60 mb-3">{title}</div>
      <div className={`${height} flex items-end justify-center`}>{children}</div>
    </div>
  )
}

function BarChartPlaceholder() {
  const bars = [40, 65, 50, 80, 60, 90, 75]
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  return (
    <div className="w-full flex items-end justify-around gap-2 h-full pb-2">
      {bars.map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full rounded-t-md bg-emerald-500/40 border-t-2 border-emerald-500" style={{ height: `${h}%` }} />
          <span className="text-[9px] text-white/30">{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

function FunnelPlaceholder() {
  const steps = [
    { label: "Visits",        w: "w-full", color: "bg-blue-500/30 border-blue-500" },
    { label: "Add Cart",      w: "w-4/5",  color: "bg-orange-500/30 border-orange-500" },
    { label: "Checkout",      w: "w-3/5",  color: "bg-yellow-500/30 border-yellow-500" },
    { label: "COD Confirmed", w: "w-2/5",  color: "bg-emerald-500/30 border-emerald-500" },
  ]
  return (
    <div className="w-full flex flex-col items-center justify-center gap-1.5 h-full">
      {steps.map(s => (
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
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500"    />Cancelled 11%</div>
      </div>
    </div>
  )
}

function HBarPlaceholder() {
  const agents = [
    { name: "Agent Alpha", val: 92 },
    { name: "Agent Beta",  val: 78 },
    { name: "Agent Gamma", val: 85 },
    { name: "Agent Delta", val: 64 },
  ]
  return (
    <div className="w-full space-y-3 h-full flex flex-col justify-center">
      {agents.map(a => (
        <div key={a.name} className="flex items-center gap-3">
          <span className="text-[10px] text-white/50 w-24 text-right shrink-0">{a.name}</span>
          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500/50 border-r-2 border-emerald-500 rounded-full" style={{ width: `${a.val}%` }} />
          </div>
          <span className="text-[10px] text-emerald-400 w-8 shrink-0">{a.val}%</span>
        </div>
      ))}
    </div>
  )
}

function SchemaCard({ title, color, source, fields }: {
  title: string; color: string; source: string; fields: { name: string; type: string; note: string }[]
}) {
  const colors: Record<string, { border: string; text: string; badge: string }> = {
    orange: { border: "border-orange-500/20", text: "text-orange-400", badge: "bg-orange-500/10 text-orange-300" },
    blue:   { border: "border-blue-500/20",   text: "text-blue-400",   badge: "bg-blue-500/10 text-blue-300" },
  }
  const c = colors[color]
  return (
    <div className={`border ${c.border} rounded-xl bg-[#161b22] p-4`}>
      <div className={`text-xs font-semibold ${c.text} mb-0.5`}>{title}</div>
      <div className="text-[10px] text-white/30 mb-3 font-mono">{source}</div>
      <div className="space-y-1.5">
        {fields.map(f => (
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
    Pending:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    Cancelled: "bg-red-500/15 text-red-400 border-red-500/25",
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${map[status] ?? "bg-white/10 text-white/50"}`}>
      {status}
    </span>
  )
}

function RunStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    failed:    "bg-red-500/15 text-red-400 border-red-500/25",
    "no-answer":"bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium capitalize ${map[status] ?? "bg-white/10 text-white/50"}`}>
      {status.replace("-", " ")}
    </span>
  )
}

function CallTypeBadge({ type }: { type: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium capitalize ${
      type === "inbound" ? "bg-blue-500/15 text-blue-400 border-blue-500/25" : "bg-purple-500/15 text-purple-400 border-purple-500/25"
    }`}>
      {type}
    </span>
  )
}

function WaBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Sent:    "text-[#25d366]",
    Pending: "text-yellow-400",
    Failed:  "text-red-400",
  }
  return <span className={`text-[10px] font-medium ${map[status] ?? "text-white/40"}`}>{status}</span>
}

function ActionBtn({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20",
    blue:    "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20",
    orange:  "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/20",
    green:   "bg-[#25d366]/10 text-[#25d366] hover:bg-[#25d366]/20 border-[#25d366]/20",
    gray:    "bg-white/5 text-white/50 hover:bg-white/10 border-white/10",
    red:     "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20",
  }
  return (
    <button className={`text-[10px] px-2 py-1 rounded border font-medium transition-all ${colors[color] ?? colors.gray}`}>
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

/* ── SVG Icons ── */
function OverviewIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
function PhoneIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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
function CartIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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
function WalletNavIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}
function WalletIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}
function BillingIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  )
}
function ProfileIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
function BellIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}
