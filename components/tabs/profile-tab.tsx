"use client"

import { useState, useEffect } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { User, Key, Bell, Shield, Building2, Eye, EyeOff, CheckCircle2, Copy, Loader2, RefreshCw, X, Plus, ChevronDown as ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type ProfileSection = "account" | "integrations" | "security" | "notifications"

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── WorkflowPicker ───────────────────────────────────────────────────────────
// Fetches available workflows from the API and lets the user pick by name.
// Stores numeric IDs (e.g. "26") in state, displayed with workflow names.
// Dograh workflows use "workflow_id" as the id field
interface AvailableWorkflow { workflow_id: number | string; name: string; status?: string; total_runs?: number }

function WorkflowPicker({
  apiKey,
  selectedIds,
  onChange,
}: {
  apiKey: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const { data, isLoading } = useSWR<{ workflows: AvailableWorkflow[] }>(
    apiKey ? "/api/calls/workflows" : null,
    fetcher
  )
  const available: AvailableWorkflow[] = data?.workflows ?? []

  // Resolve any saved value (may be a name from before) to its numeric workflow_id string
  function resolveId(val: string): string {
    if (!val) return ""
    const trimmed = val.trim()
    const byId = available.find(w => String(w.workflow_id) === trimmed)
    if (byId) return String(byId.workflow_id)
    const byName = available.find(w => w.name.toLowerCase() === trimmed.toLowerCase())
    if (byName) return String(byName.workflow_id)
    return trimmed
  }

  const resolvedIds = selectedIds.map(resolveId)
  const addableWorkflows = available.filter(w => !resolvedIds.includes(String(w.workflow_id)))

  function removeAt(idx: number) {
    onChange(selectedIds.filter((_, i) => i !== idx))
  }

  function addWorkflow(id: string) {
    if (id && !resolvedIds.includes(id)) onChange([...selectedIds.filter(Boolean), id])
  }

  return (
    <div className="py-4 border-b border-black/[0.06]">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#1d1d1f]">Workflows</p>
          <p className="text-[11px] text-[#6e6e73] mt-0.5">
            Select workflows — runs from all selected workflows appear in the Calls tab.
          </p>
        </div>
        <div className="space-y-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-[13px] text-[#6e6e73]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading workflows…
            </div>
          )}

          {/* Selected workflow chips */}
          {resolvedIds.filter(Boolean).map((wfId, idx) => {
            const wf = available.find(w => String(w.workflow_id) === wfId)
            return (
              <div key={idx} className="flex items-center gap-2 bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1d1d1f] truncate">
                    {wf ? wf.name : `ID: ${wfId}`}
                  </p>
                  <p className="text-[11px] font-mono text-[#6e6e73]">
                    workflow_id: {wfId}{wf ? ` · ${wf.total_runs ?? 0} runs` : ""}
                  </p>
                </div>
                <button
                  onClick={() => removeAt(idx)}
                  className="p-1.5 rounded-lg hover:bg-[#ff3b30]/10 text-[#6e6e73] hover:text-[#ff3b30] transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}

          {/* Add workflow dropdown — constrained width, no overflow */}
          {!isLoading && addableWorkflows.length > 0 && (
            <div className="relative w-full">
              <select
                value=""
                onChange={e => { addWorkflow(e.target.value); (e.target as HTMLSelectElement).value = "" }}
                className="w-full max-w-full bg-[#f5f5f7] rounded-xl pl-3.5 pr-8 py-2.5 text-[13px] text-[#1d1d1f] outline-none border border-transparent focus:border-[#0066cc]/30 appearance-none cursor-pointer truncate"
              >
                <option value="" disabled>+ Add a workflow…</option>
                {addableWorkflows.map(w => (
                  <option key={String(w.workflow_id)} value={String(w.workflow_id)}>
                    {w.name} (ID: {w.workflow_id})
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e73]" />
            </div>
          )}

          {!isLoading && available.length === 0 && (
            <p className="text-[12px] text-[#6e6e73]">
              Save your Voice API key first to load available workflows.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Reusable components ─────────────────────────────────────────────────────

function SectionButton({ id, label, icon: Icon, active, onClick }: { id: ProfileSection; label: string; icon: React.ElementType; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[14px] font-medium transition-all text-left",
        active ? "bg-[#0066cc]/10 text-[#0066cc]" : "text-[#6e6e73] hover:bg-[#f5f5f7]"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-[#0066cc]" : "text-[#6e6e73]")} />
      {label}
    </button>
  )
}

function SecretField({ label, value, onChange, hint }: { label: string; value: string; onChange?: (v: string) => void; hint?: string }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-4 border-b border-black/[0.06] last:border-0">
      <div className="sm:col-span-1">
        <p className="text-[13px] font-medium text-[#1d1d1f]">{label}</p>
        {hint && <p className="text-[11px] text-[#6e6e73] mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <div className="flex-1 bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
          {onChange ? (
            <input
              type={show ? "text" : "password"}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="••••••••••••"
              className="bg-transparent text-[13px] text-[#1d1d1f] flex-1 font-mono outline-none"
            />
          ) : (
            <span className="text-[13px] text-[#1d1d1f] flex-1 font-mono truncate">
              {show ? value : "•".repeat(Math.min(value.length || 16, 24))}
            </span>
          )}
          <button onClick={() => setShow(!show)} className="text-[#6e6e73] hover:text-[#1d1d1f]">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="p-2 rounded-lg hover:bg-[#f5f5f7]">
          {copied ? <CheckCircle2 className="w-4 h-4 text-[#34c759]" /> : <Copy className="w-4 h-4 text-[#6e6e73]" />}
        </button>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, hint, type = "text" }: { label: string; value: string; onChange?: (v: string) => void; hint?: string; type?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-4 border-b border-black/[0.06] last:border-0">
      <div>
        <p className="text-[13px] font-medium text-[#1d1d1f]">{label}</p>
        {hint && <p className="text-[11px] text-[#6e6e73] mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-2">
        {onChange ? (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1d1d1f] outline-none border border-transparent focus:border-[#0066cc]/30"
          />
        ) : (
          <div className="bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1d1d1f]">{value || "—"}</div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({ label, sub, enabled, onChange }: { label: string; sub: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3 py-4 border-b border-black/[0.06] last:border-0">
      <div className="flex-1">
        <p className="text-[13px] font-medium text-[#1d1d1f]">{label}</p>
        <p className="text-[12px] text-[#6e6e73] mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn("relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5", enabled ? "bg-[#34c759]" : "bg-[#c7c7cc]")}
        role="switch" aria-checked={enabled}
      >
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", enabled ? "translate-x-5" : "translate-x-0")} />
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileTab() {
  const [section, setSection] = useState<ProfileSection>("account")
  const { data: tenant, mutate } = useSWR("/api/tenant", fetcher)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Account fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [org, setOrg] = useState("")
  const [phone, setPhone] = useState("")

  // BotSailor auto-detect
  const [detectingPhone, setDetectingPhone] = useState(false)
  const [detectError, setDetectError] = useState("")
  const [detectedAccounts, setDetectedAccounts] = useState<{ phone_number_id: string; display_phone_number: string; name: string }[]>([])

  async function autoDetectPhoneId() {
    setDetectingPhone(true); setDetectError(""); setDetectedAccounts([])
    try {
      const res = await fetch("/api/whatsapp/verify")
      const json = await res.json()
      if (json.error) { setDetectError(json.error); return }
      const accounts = json.accounts ?? []
      if (accounts.length === 0) {
        setDetectError("No WhatsApp accounts found on this BotSailor key.")
        return
      }
      setDetectedAccounts(accounts)
      if (accounts.length === 1) {
        const phoneId = accounts[0].phone_number_id
        setBotsailorPhoneId(phoneId)
        // Auto-save immediately so it persists without the user having to click Save
        await handleSave({
          botsailor_api_key: botsailorKey,
          botsailor_phone_id: phoneId,
        })
      }
      // If multiple accounts, show list — user must pick one, then save
    } catch {
      setDetectError("Failed to reach BotSailor. Check your API key.")
    } finally {
      setDetectingPhone(false)
    }
  }

  // Integration fields
  const [voiceApiKey, setVoiceApiKey] = useState("")
  const [voiceBaseUrl, setVoiceBaseUrl] = useState("")
  // Multi-workflow: stored as newline-separated string in tenant, array in UI
  const [workflowIds, setWorkflowIds] = useState<string[]>([""])
  const [botsailorKey, setBotsailorKey] = useState("")
  const [botsailorPhoneId, setBotsailorPhoneId] = useState("")
  const [shopifyDomain, setShopifyDomain] = useState("")
  const [clientSupabaseUrl, setClientSupabaseUrl] = useState("")
  const [clientSupabaseKey, setClientSupabaseKey] = useState("")
  const [codTableName, setCodTableName] = useState("")
  const [cartTableName, setCartTableName] = useState("")
  const [supportTableName, setSupportTableName] = useState("")
  const [reviewTableName, setReviewTableName] = useState("")
  const [razorpayKeyId, setRazorpayKeyId] = useState("")
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("")

  // Notification flags
  const [notifs, setNotifs] = useState({
    call_complete: true,
    call_failed: true,
    cod_confirmed: true,
    cart_abandoned: false,
    low_balance: true,
    wa_message: false,
  })

  // Populate from tenant on load
  useEffect(() => {
    if (!tenant) return
    setName(tenant.name ?? "")
    setEmail(tenant.email ?? "")
    setOrg(tenant.company_name ?? "")
    setPhone(tenant.phone ?? "")
    setVoiceApiKey(tenant.voice_api_key ?? "")
    setVoiceBaseUrl(tenant.voice_base_url ?? "")
    // voice_workflow_ids stored as newline-separated string; fall back to old single field
    const raw: string = tenant.voice_workflow_ids ?? tenant.voice_workflow_id ?? ""
    setWorkflowIds(raw ? raw.split("\n").filter(Boolean) : [""])
    setBotsailorKey(tenant.botsailor_api_key ?? "")
    setBotsailorPhoneId(tenant.botsailor_phone_id ?? "")
    setShopifyDomain(tenant.shopify_store_domain ?? "")
    setClientSupabaseUrl(tenant.client_supabase_url ?? "")
    setClientSupabaseKey(tenant.client_supabase_anon_key ?? "")
    setCodTableName(tenant.cod_table_name ?? "")
    setCartTableName(tenant.cart_table_name ?? "")
    setSupportTableName(tenant.support_table_name ?? "")
    setReviewTableName(tenant.review_table_name ?? "")
    setRazorpayKeyId(tenant.razorpay_key_id ?? "")
    setRazorpayKeySecret(tenant.razorpay_key_secret ?? "")
    setNotifs(n => ({
      ...n,
      ...(tenant.notification_prefs ?? {}),
    }))
  }, [tenant])

  async function handleSave(payload: Record<string, unknown>) {
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveError(json?.error ?? `Save failed (${res.status})`)
        return
      }
      await mutate()
      globalMutate("/api/tenant")
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  function SaveButton({ payload }: { payload: Record<string, unknown> }) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleSave(payload)}
          disabled={saving}
          className={cn(
            "bg-[#0066cc] text-white text-[13px] font-semibold rounded-full px-5 py-2.5 active:scale-95 transition-all disabled:opacity-60 w-fit",
            saved && "bg-[#34c759]"
          )}
        >
          {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
        </button>
        {saveError && <p className="text-[12px] text-red-600">{saveError}</p>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Nav sidebar */}
      <div className="bg-white rounded-2xl hairline p-3 space-y-1 lg:col-span-1 h-fit">
        <SectionButton id="account" label="Account" icon={User} active={section === "account"} onClick={() => setSection("account")} />
        <SectionButton id="integrations" label="Integrations" icon={Building2} active={section === "integrations"} onClick={() => setSection("integrations")} />
        <SectionButton id="security" label="Security" icon={Shield} active={section === "security"} onClick={() => setSection("security")} />
        <SectionButton id="notifications" label="Notifications" icon={Bell} active={section === "notifications"} onClick={() => setSection("notifications")} />
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl hairline p-5 lg:col-span-3">

        {/* Account */}
        {section === "account" && (
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Account</p>
            <p className="text-[13px] text-[#6e6e73] mb-6">Your personal and organization info</p>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-black/[0.06]">
              <div className="w-16 h-16 rounded-full bg-[#0066cc] flex items-center justify-center text-white text-[22px] font-semibold">
                {(name[0] ?? "A").toUpperCase()}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1d1d1f]">{name || "User"}</p>
                <p className="text-[13px] text-[#6e6e73]">{email}</p>
              </div>
            </div>
            <TextField label="Full Name" value={name} onChange={setName} />
            <TextField label="Email" value={email} onChange={setEmail} type="email" />
            <TextField label="Organization" value={org} onChange={setOrg} />
            <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
            <div className="mt-4">
              <SaveButton payload={{ name, email, company_name: org, phone }} />
            </div>
          </div>
        )}

        {/* Integrations */}
        {section === "integrations" && (
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Integrations</p>
            <p className="text-[13px] text-[#6e6e73] mb-6">API keys and service connections</p>

            <div className="space-y-6">
              {/* Voice */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#0066cc]/10 flex items-center justify-center">
                    <Key className="w-3.5 h-3.5 text-[#0066cc]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">Dograh / LarynxAI Voice</p>
                  <span className={cn("ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full",
                    voiceApiKey ? "bg-[#34c759]/10 text-[#1a7a32]" : "bg-[#ff9500]/10 text-[#8a5900]"
                  )}>
                    {voiceApiKey ? "Connected" : "Not set"}
                  </span>
                </div>
                <SecretField label="API Key" value={voiceApiKey} onChange={setVoiceApiKey} hint="Used for all call triggers and run retrieval" />
                <TextField label="Base URL" value={voiceBaseUrl} onChange={setVoiceBaseUrl} hint="e.g. https://voice.larynxai.in" />
                <WorkflowPicker
                  apiKey={voiceApiKey}
                  selectedIds={workflowIds}
                  onChange={setWorkflowIds}
                />
              </div>

              {/* BotSailor */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#34c759]/10 flex items-center justify-center">
                    <Key className="w-3.5 h-3.5 text-[#34c759]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">BotSailor WhatsApp</p>
                  <span className={cn("ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full",
                    botsailorKey ? "bg-[#34c759]/10 text-[#1a7a32]" : "bg-[#ff9500]/10 text-[#8a5900]"
                  )}>
                    {botsailorKey ? "Connected" : "Not set"}
                  </span>
                </div>
                <SecretField label="API Token" value={botsailorKey} onChange={setBotsailorKey} hint="BotSailor account API token" />
                <TextField label="Phone Number ID" value={botsailorPhoneId} onChange={setBotsailorPhoneId} hint="WhatsApp Business phone number ID (e.g. 11906XXXXXX40020)" />
                {/* Auto-detect button */}
                <div className="py-2">
                  <button
                    onClick={autoDetectPhoneId}
                    disabled={!botsailorKey || detectingPhone}
                    className="flex items-center gap-2 text-[12px] font-medium text-[#0066cc] hover:text-[#0055b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {detectingPhone
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <RefreshCw className="w-3.5 h-3.5" />}
                    Auto-detect Phone Number ID from BotSailor
                  </button>
                  {detectError && <p className="text-[12px] text-red-600 mt-1.5">{detectError}</p>}
                  {detectedAccounts.length > 1 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[12px] text-[#6e6e73]">Multiple accounts found — click one to select and save:</p>
                      {detectedAccounts.map(a => (
                        <button
                          key={a.phone_number_id}
                          onClick={async () => {
                            setBotsailorPhoneId(a.phone_number_id)
                            await handleSave({ botsailor_api_key: botsailorKey, botsailor_phone_id: a.phone_number_id })
                          }}
                          className={cn(
                            "w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-[12px] border transition-colors",
                            botsailorPhoneId === a.phone_number_id
                              ? "border-[#0066cc] bg-[#0066cc]/5 text-[#0066cc]"
                              : "border-[rgba(0,0,0,0.08)] hover:bg-[#f5f5f7] text-[#1d1d1f]"
                          )}
                        >
                          <span className="font-medium">{a.display_phone_number}</span>
                          <span className="font-mono text-[#6e6e73]">{a.phone_number_id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {detectedAccounts.length === 1 && botsailorPhoneId === detectedAccounts[0].phone_number_id && (
                    <p className="text-[12px] text-[#34c759] mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Auto-filled: {detectedAccounts[0].display_phone_number}
                    </p>
                  )}
                </div>
              </div>

              {/* Shopify / Order Tables */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#95bf47]/20 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-[#5a8a00]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">Order Tables</p>
                  <span className={cn("ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full",
                    (codTableName || cartTableName) ? "bg-[#34c759]/10 text-[#1a7a32]" : "bg-[#ff9500]/10 text-[#8a5900]"
                  )}>
                    {(codTableName || cartTableName) ? "Configured" : "Not set"}
                  </span>
                </div>
                <p className="text-[12px] text-[#6e6e73] mb-3">These tables are read directly from your connected Supabase project. Click Detect to auto-fill from your actual table list.</p>
                {/* COD Table */}
                <div className="py-1">
                  <p className="text-[12px] font-medium text-[#6e6e73] mb-1">COD Table Name</p>
                  <div className="flex gap-2 items-center">
                    <input
                      value={codTableName}
                      onChange={e => setCodTableName(e.target.value)}
                      placeholder="e.g. cod_confirmation"
                      className="flex-1 bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1d1d1f] outline-none placeholder:text-[#c7c7cc]"
                    />
                    <DetectTablesButton onSelect={setCodTableName} label="COD" />
                  </div>
                </div>
                {/* Cart Table */}
                <div className="py-1">
                  <p className="text-[12px] font-medium text-[#6e6e73] mb-1">Cart Table Name</p>
                  <div className="flex gap-2 items-center">
                    <input
                      value={cartTableName}
                      onChange={e => setCartTableName(e.target.value)}
                      placeholder="e.g. E-commerce add to cart"
                      className="flex-1 bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1d1d1f] outline-none placeholder:text-[#c7c7cc]"
                    />
                    <DetectTablesButton onSelect={setCartTableName} label="Cart" />
                  </div>
                </div>
                {/* Support Table */}
                <div className="py-1">
                  <p className="text-[12px] font-medium text-[#6e6e73] mb-1">Customer Support Table Name</p>
                  <div className="flex gap-2 items-center">
                    <input
                      value={supportTableName}
                      onChange={e => setSupportTableName(e.target.value)}
                      placeholder="e.g. customer_support"
                      className="flex-1 bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1d1d1f] outline-none placeholder:text-[#c7c7cc]"
                    />
                    <DetectTablesButton onSelect={setSupportTableName} label="Support" />
                  </div>
                </div>
                {/* Review Table */}
                <div className="py-1">
                  <p className="text-[12px] font-medium text-[#6e6e73] mb-1">Customer Review Table Name</p>
                  <div className="flex gap-2 items-center">
                    <input
                      value={reviewTableName}
                      onChange={e => setReviewTableName(e.target.value)}
                      placeholder="e.g. customer_review"
                      className="flex-1 bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1d1d1f] outline-none placeholder:text-[#c7c7cc]"
                    />
                    <DetectTablesButton onSelect={setReviewTableName} label="Review" />
                  </div>
                </div>
              </div>

              {/* Razorpay */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#0066cc]/10 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-[#0066cc]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">Razorpay</p>
                  <span className={cn("ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full",
                    razorpayKeyId ? "bg-[#34c759]/10 text-[#1a7a32]" : "bg-[#ff9500]/10 text-[#8a5900]"
                  )}>
                    {razorpayKeyId ? "Connected" : "Not set"}
                  </span>
                </div>
                <TextField label="Key ID" value={razorpayKeyId} onChange={setRazorpayKeyId} hint="Razorpay key_id" />
                <SecretField label="Key Secret" value={razorpayKeySecret} onChange={setRazorpayKeySecret} hint="Razorpay key_secret" />
              </div>
            </div>

            <div className="mt-5">
              <SaveButton payload={{
                voice_api_key: voiceApiKey,
                voice_base_url: voiceBaseUrl,
                voice_workflow_ids: workflowIds.filter(Boolean).join("\n"),
                botsailor_api_key: botsailorKey,
                botsailor_phone_id: botsailorPhoneId,
                shopify_store_domain: shopifyDomain,
                cod_table_name: codTableName,
                cart_table_name: cartTableName,
                support_table_name: supportTableName,
                review_table_name: reviewTableName,
                razorpay_key_id: razorpayKeyId,
                razorpay_key_secret: razorpayKeySecret,
              }} />
            </div>
          </div>
        )}

        {/* Security */}
        {section === "security" && (
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Security</p>
            <p className="text-[13px] text-[#6e6e73] mb-6">Password and 2FA management</p>
            <PasswordSection />
          </div>
        )}

        {/* Notifications */}
        {section === "notifications" && (
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Notifications</p>
            <p className="text-[13px] text-[#6e6e73] mb-6">Control what alerts you receive</p>
            <ToggleRow label="Call Completed" sub="Notify when a call run finishes successfully" enabled={notifs.call_complete} onChange={v => setNotifs(n => ({ ...n, call_complete: v }))} />
            <ToggleRow label="Call Failed" sub="Notify when a call run fails or gets no answer" enabled={notifs.call_failed} onChange={v => setNotifs(n => ({ ...n, call_failed: v }))} />
            <ToggleRow label="COD Confirmed" sub="Notify when a COD order is confirmed by customer" enabled={notifs.cod_confirmed} onChange={v => setNotifs(n => ({ ...n, cod_confirmed: v }))} />
            <ToggleRow label="Cart Abandoned" sub="Notify when a new cart abandonment is recorded" enabled={notifs.cart_abandoned} onChange={v => setNotifs(n => ({ ...n, cart_abandoned: v }))} />
            <ToggleRow label="Low Balance Alert" sub="Notify when wallet balance falls below ₹100" enabled={notifs.low_balance} onChange={v => setNotifs(n => ({ ...n, low_balance: v }))} />
            <ToggleRow label="New WhatsApp Message" sub="Notify when a customer sends a new message" enabled={notifs.wa_message} onChange={v => setNotifs(n => ({ ...n, wa_message: v }))} />
            <div className="mt-4">
              <SaveButton payload={{ notification_prefs: notifs }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetectTablesButton({
  onSelect, label,
}: { onSelect: (t: string) => void; label: string }) {
  const [tables, setTables] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState("")

  async function detect() {
    setLoading(true); setErr(""); setOpen(false)
    try {
      const res = await fetch("/api/shopify/tables")
      const json = await res.json()
      if (json.error) { setErr(json.error); return }
      setTables(json.tables ?? [])
      setOpen(true)
    } catch { setErr("Failed to fetch tables") }
    finally { setLoading(false) }
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={detect}
        disabled={loading}
        className="flex items-center gap-1.5 text-[12px] font-medium text-[#0066cc] hover:text-[#0055b3] disabled:opacity-50 whitespace-nowrap px-3 py-2.5 bg-[#f5f5f7] rounded-xl transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Detect
      </button>
      {err && <p className="absolute left-0 top-full mt-1 text-[11px] text-red-600 whitespace-nowrap z-10">{err}</p>}
      {open && tables.length > 0 && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[rgba(0,0,0,0.1)] rounded-xl shadow-lg z-20 min-w-[220px] max-h-60 overflow-y-auto py-1">
          <p className="px-3 py-1.5 text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider">Select {label} table</p>
          {tables.map(t => (
            <button
              key={t}
              onClick={() => { onSelect(t); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-[13px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors font-mono"
            >
              {t}
            </button>
          ))}
          <button onClick={() => setOpen(false)} className="w-full text-left px-3 py-2 text-[12px] text-[#6e6e73] hover:bg-[#f5f5f7] border-t border-[rgba(0,0,0,0.06)]">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function PasswordInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">{label}</label>
      <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-xl px-3.5 py-2.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent text-[13px] text-[#1d1d1f] outline-none"
        />
        <button onClick={() => setShow(s => !s)} className="text-[#6e6e73]">
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

function PasswordSection() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (next !== confirm) { setError("Passwords don't match"); return }
    if (next.length < 8) { setError("Password must be at least 8 characters"); return }
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: current, new_password: next }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      setDone(true)
      setCurrent(""); setNext(""); setConfirm("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <PasswordInput label="Current Password" value={current} onChange={setCurrent} />
      <PasswordInput label="New Password" value={next} onChange={setNext} />
      <PasswordInput label="Confirm New Password" value={confirm} onChange={setConfirm} />
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      {done && <p className="text-[13px] text-[#34c759]">Password updated successfully!</p>}
      <button
        onClick={handleSubmit}
        disabled={loading || !current || !next || !confirm}
        className="bg-[#0066cc] text-white text-[13px] font-semibold rounded-full px-5 py-2.5 active:scale-95 transition-all disabled:opacity-60"
      >
        {loading ? "Updating…" : "Update Password"}
      </button>
    </div>
  )
}
