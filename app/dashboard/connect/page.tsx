// ===== DEMO-ONLY AUTH PAGE - SAFE TO DELETE =====
// Remove this file (app/dashboard/connect/page.tsx) and its sidebar link before going to production
// ==================================================

"use client"

import { useState } from "react"
import Image from "next/image"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { useTenant } from "@/hooks/use-tenant"
import { Check, Loader2, ShieldCheck, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

type ConnectionState = "idle" | "loading" | "connected"

function ConnectCard({
  logo,
  brandColor,
  title,
  description,
  inputLabel,
  placeholder,
  buttonText,
  value,
  onChange,
  state,
  onConnect,
}: {
  logo: React.ReactNode
  brandColor: string
  title: string
  description: string
  inputLabel: string
  placeholder: string
  buttonText: string
  value: string
  onChange: (v: string) => void
  state: ConnectionState
  onConnect: () => void
}) {
  return (
    <div className="bg-card rounded-[16px] border border-hairline p-6 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div
          className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center text-white shrink-0", brandColor)}
        >
          {logo}
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
          <p className="text-[13px] text-mute mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[12px] font-medium text-body">{inputLabel}</label>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={state === "loading" || state === "connected"}
          className={cn(
            "w-full bg-surface rounded-[10px] px-3.5 py-2.5 text-[13px] text-ink outline-none border border-hair2 placeholder:text-faint transition-all",
            "focus:border-[#95BF47] focus:ring-1 focus:ring-[#95BF47]/20",
            (state === "loading" || state === "connected") && "opacity-60 cursor-not-allowed"
          )}
        />
      </div>

      <button
        onClick={onConnect}
        disabled={state === "loading" || state === "connected"}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-semibold text-white transition-all",
          state === "connected" ? "bg-success" : brandColor,
          (state === "loading" || state === "connected") && "opacity-90 cursor-not-allowed"
        )}
      >
        {state === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting…
          </>
        ) : state === "connected" ? (
          <>
            <Check className="w-4 h-4" />
            Connected
          </>
        ) : (
          buttonText
        )}
      </button>

      <div className="flex items-center gap-3 pt-1 text-[11px] text-faint">
        <span className="inline-flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Secure connection
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          OAuth 2.0
        </span>
      </div>
    </div>
  )
}

export default function ConnectAccountsPage() {
  const { tenant } = useTenant()
  const [shopifyUrl, setShopifyUrl] = useState("")
  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [shopifyState, setShopifyState] = useState<ConnectionState>("idle")
  const [whatsappState, setWhatsappState] = useState<ConnectionState>("idle")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function handleConnectShopify() {
    if (shopifyState !== "idle") return
    setShopifyState("loading")
    setTimeout(() => setShopifyState("connected"), 2000)
  }

  function handleConnectWhatsApp() {
    if (whatsappState !== "idle") return
    setWhatsappState("loading")
    setTimeout(() => setWhatsappState("connected"), 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar
        activeTab="overview"
        onTabChange={() => {}}
        walletBalance={tenant?.wallet_balance ?? 0}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          activeTab="overview"
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          notificationCount={0}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-6 py-5 max-w-screen-xl mx-auto">
            <div className="mb-8">
              <h1 className="text-[22px] font-semibold text-ink tracking-tight">Connect Accounts</h1>
              <p className="text-[14px] text-mute mt-1 max-w-xl">
                Link your Shopify store and WhatsApp Business account to enable automated order confirmations, cart recovery, and customer support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[760px]">
              <ConnectCard
                logo={<Image src="/shopify-logo.svg" alt="Shopify" width={28} height={28} />}
                brandColor="bg-[#95BF47]"
                title="Connect Shopify"
                description="Sync orders, abandoned carts, and customer data from your Shopify store."
                inputLabel="Store URL"
                placeholder="yourstore.myshopify.com"
                buttonText="Connect Store"
                value={shopifyUrl}
                onChange={setShopifyUrl}
                state={shopifyState}
                onConnect={handleConnectShopify}
              />

              <ConnectCard
                logo={<WhatsAppLogo className="w-7 h-7" />}
                brandColor="bg-[#25d366]"
                title="Connect WhatsApp Business"
                description="Send order confirmations, delivery updates, and cart recovery messages via WhatsApp."
                inputLabel="Business Phone Number"
                placeholder="+91 98765 43210"
                buttonText="Connect WhatsApp"
                value={whatsappPhone}
                onChange={setWhatsappPhone}
                state={whatsappState}
                onConnect={handleConnectWhatsApp}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
