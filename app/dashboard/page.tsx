"use client"

import { useState } from "react"
import { Sidebar, type NavTab } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { OverviewTab } from "@/components/tabs/overview-tab"
import { CallsTab } from "@/components/tabs/calls-tab"
import { ShopifyTab } from "@/components/tabs/shopify-tab"
import { WhatsAppTab } from "@/components/tabs/whatsapp-tab"
import { CustomerSupportTab } from "@/components/tabs/customer-support-tab"
import { CustomerReviewTab } from "@/components/tabs/customer-review-tab"
import { WalletTab } from "@/components/tabs/wallet-tab"
import { BillingTab } from "@/components/tabs/billing-tab"
import { ProfileTab } from "@/components/tabs/profile-tab"
import { useTenant } from "@/hooks/use-tenant"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { tenant } = useTenant()

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        walletBalance={tenant?.wallet_balance ?? 0}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          notificationCount={0}
          onTabChange={setActiveTab}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-6 py-5 max-w-screen-xl mx-auto">
            {activeTab === "overview"  && <OverviewTab />}
            {activeTab === "calls"    && <CallsTab />}
            {activeTab === "shopify"  && <ShopifyTab />}
            {activeTab === "whatsapp" && <WhatsAppTab />}
            {activeTab === "support"  && <CustomerSupportTab />}
            {activeTab === "reviews"  && <CustomerReviewTab />}
            {activeTab === "wallet"   && <WalletTab onTabChange={setActiveTab} />}
            {activeTab === "billing"  && <BillingTab />}
            {activeTab === "profile"  && <ProfileTab />}
          </div>
        </main>
      </div>
    </div>
  )
}
