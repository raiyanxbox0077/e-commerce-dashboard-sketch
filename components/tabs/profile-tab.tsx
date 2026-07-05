"use client"

import { useState } from "react"
import { User, Key, Bell, Shield, Building2, Eye, EyeOff, CheckCircle2, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

type ProfileSection = "account" | "integrations" | "security" | "notifications"

function SectionButton({ id, label, icon: Icon, active, onClick }: { id: ProfileSection; label: string; icon: React.ElementType; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[14px] font-medium transition-all text-left",
        active ? "bg-[#0066cc]/10 text-[#0066cc]" : "text-[#6e6e73] hover:bg-[#f5f5f7]"
      )}
    >
      <Icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-[#0066cc]" : "text-[#6e6e73]")} />
      {label}
    </button>
  )
}

function FieldRow({ label, value, type = "text", hint }: { label: string; value: string; type?: string; hint?: string }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const isSecret = type === "password" || type === "apikey"

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-4 border-b border-black/[0.06] last:border-0">
      <div className="sm:col-span-1">
        <p className="text-[13px] font-medium text-[#1d1d1f]">{label}</p>
        {hint && <p className="text-[11px] text-[#6e6e73] mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <div className="flex-1 bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
          <span className="text-[13px] text-[#1d1d1f] flex-1 font-mono truncate">
            {isSecret && !show ? "•".repeat(Math.min(value.length, 24)) : value}
          </span>
          {isSecret && (
            <button onClick={() => setShow(!show)} className="text-[#6e6e73] hover:text-[#1d1d1f]">
              {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        {isSecret && (
          <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-[#f5f5f7] transition-colors">
            {copied ? <CheckCircle2 className="w-4 h-4 text-[#34c759]" /> : <Copy className="w-4 h-4 text-[#6e6e73]" />}
          </button>
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
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5",
          enabled ? "bg-[#34c759]" : "bg-[#c7c7cc]"
        )}
        role="switch"
        aria-checked={enabled}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  )
}

export function ProfileTab() {
  const [section, setSection] = useState<ProfileSection>("account")
  const [notifs, setNotifs] = useState({
    call_complete: true,
    call_failed: true,
    cod_confirmed: true,
    cart_abandoned: false,
    low_balance: true,
    wa_message: false,
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Nav sidebar */}
      <div className="bg-white rounded-2xl hairline p-3 space-y-1 lg:col-span-1 h-fit">
        <SectionButton id="account" label="Account" icon={User} active={section === "account"} onClick={() => setSection("account")} />
        <SectionButton id="integrations" label="Integrations" icon={Building2} active={section === "integrations"} onClick={() => setSection("integrations")} />
        <SectionButton id="security" label="Security & API Keys" icon={Shield} active={section === "security"} onClick={() => setSection("security")} />
        <SectionButton id="notifications" label="Notifications" icon={Bell} active={section === "notifications"} onClick={() => setSection("notifications")} />
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl hairline p-5 lg:col-span-3">
        {section === "account" && (
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Account</p>
            <p className="text-[13px] text-[#6e6e73] mb-6">Your personal and organization info</p>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-black/[0.06]">
              <div className="w-16 h-16 rounded-full bg-[#0066cc] flex items-center justify-center text-white text-[22px] font-semibold">A</div>
              <div>
                <p className="text-[15px] font-semibold text-[#1d1d1f]">Admin User</p>
                <p className="text-[13px] text-[#6e6e73]">admin@company.com</p>
              </div>
              <button className="ml-auto text-[13px] font-medium text-[#0066cc] px-4 py-2 rounded-full hover:bg-[#0066cc]/10 transition-colors">
                Change
              </button>
            </div>
            <FieldRow label="Full Name" value="Admin User" />
            <FieldRow label="Email" value="admin@company.com" />
            <FieldRow label="Organization" value="My Company Pvt Ltd" />
            <FieldRow label="Phone" value="+91 98765 43210" />
            <div className="mt-4">
              <button className="bg-[#0066cc] text-white text-[13px] font-semibold rounded-full px-5 py-2.5 active:scale-95 transition-transform">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {section === "integrations" && (
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Integrations</p>
            <p className="text-[13px] text-[#6e6e73] mb-6">API keys and service connections</p>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#0066cc]/10 flex items-center justify-center">
                    <Key className="w-3.5 h-3.5 text-[#0066cc]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">Dograh / LarynxAI Voice</p>
                  <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#1a7a32]">Connected</span>
                </div>
                <FieldRow label="API Key" value="sk-dg_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" type="apikey" hint="Used for all call triggers and run retrieval" />
                <FieldRow label="Base URL" value="https://voice.larynxai.in" hint="Self-hosted Dograh instance" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#34c759]/10 flex items-center justify-center">
                    <Key className="w-3.5 h-3.5 text-[#34c759]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">BotSailor WhatsApp</p>
                  <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#1a7a32]">Connected</span>
                </div>
                <FieldRow label="API Token" value="bs_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" type="apikey" hint="BotSailor account API token" />
                <FieldRow label="Phone Number ID" value="1234567890" hint="WhatsApp Business phone number ID" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#af52de]/10 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-[#af52de]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">Shopify</p>
                  <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#1a7a32]">Connected</span>
                </div>
                <FieldRow label="Store Domain" value="my-store.myshopify.com" hint="Your Shopify store domain" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#0066cc]/10 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-[#0066cc]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">Supabase</p>
                  <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#1a7a32]">Connected</span>
                </div>
                <FieldRow label="Project URL" value="https://xxxx.supabase.co" />
                <FieldRow label="Anon Key" value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx" type="apikey" />
              </div>
            </div>
          </div>
        )}

        {section === "security" && (
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Security</p>
            <p className="text-[13px] text-[#6e6e73] mb-6">Password, 2FA and API key management</p>
            <FieldRow label="Current Password" value="••••••••••••" type="password" />
            <FieldRow label="New Password" value="" type="password" />
            <FieldRow label="Confirm Password" value="" type="password" />
            <div className="mt-4 mb-6">
              <button className="bg-[#0066cc] text-white text-[13px] font-semibold rounded-full px-5 py-2.5 active:scale-95 transition-transform">
                Update Password
              </button>
            </div>
            <div className="border-t border-black/[0.06] pt-5">
              <p className="text-[14px] font-semibold text-[#1d1d1f] mb-3">Two-Factor Authentication</p>
              <div className="flex items-center justify-between bg-[#f5f5f7] rounded-xl px-4 py-3.5">
                <div>
                  <p className="text-[13px] font-medium text-[#1d1d1f]">Authenticator App</p>
                  <p className="text-[12px] text-[#6e6e73]">Not enabled</p>
                </div>
                <button className="text-[13px] font-semibold text-[#0066cc] px-4 py-2 rounded-full hover:bg-[#0066cc]/10 transition-colors">
                  Enable
                </button>
              </div>
            </div>
          </div>
        )}

        {section === "notifications" && (
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Notifications</p>
            <p className="text-[13px] text-[#6e6e73] mb-6">Control what alerts you receive</p>
            <ToggleRow label="Call Completed" sub="Notify when a call run finishes successfully" enabled={notifs.call_complete} onChange={(v) => setNotifs((n) => ({ ...n, call_complete: v }))} />
            <ToggleRow label="Call Failed" sub="Notify when a call run fails or gets no answer" enabled={notifs.call_failed} onChange={(v) => setNotifs((n) => ({ ...n, call_failed: v }))} />
            <ToggleRow label="COD Confirmed" sub="Notify when a COD order is confirmed by customer" enabled={notifs.cod_confirmed} onChange={(v) => setNotifs((n) => ({ ...n, cod_confirmed: v }))} />
            <ToggleRow label="Cart Abandoned" sub="Notify when a new cart abandonment is recorded" enabled={notifs.cart_abandoned} onChange={(v) => setNotifs((n) => ({ ...n, cart_abandoned: v }))} />
            <ToggleRow label="Low Balance Alert" sub="Notify when wallet balance falls below ₹100" enabled={notifs.low_balance} onChange={(v) => setNotifs((n) => ({ ...n, low_balance: v }))} />
            <ToggleRow label="New WhatsApp Message" sub="Notify when a customer sends a new message" enabled={notifs.wa_message} onChange={(v) => setNotifs((n) => ({ ...n, wa_message: v }))} />
          </div>
        )}
      </div>
    </div>
  )
}
