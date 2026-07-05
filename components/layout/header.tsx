"use client"

import { Menu, Bell, Search } from "lucide-react"
import { type NavTab } from "./sidebar"

const TAB_LABELS: Record<NavTab, string> = {
  overview: "Overview",
  calls: "Calls",
  shopify: "Shopify",
  whatsapp: "WhatsApp",
  wallet: "Wallet",
  billing: "Billing",
  profile: "Profile",
}

interface HeaderProps {
  activeTab: NavTab
  onMobileMenuOpen: () => void
  notificationCount?: number
}

export function Header({ activeTab, onMobileMenuOpen, notificationCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 frosted border-b border-black/[0.08] px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
      {/* Left: menu (mobile) + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-[#f5f5f7] text-[#6e6e73]"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            {TAB_LABELS[activeTab]}
          </h1>
        </div>
      </div>

      {/* Right: search + notifications */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-xl hover:bg-[#f5f5f7] text-[#6e6e73] transition-colors"
          aria-label="Search"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        <button
          className="relative p-2 rounded-xl hover:bg-[#f5f5f7] text-[#6e6e73] transition-colors"
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
        >
          <Bell className="w-4.5 h-4.5" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff3b30] rounded-full" />
          )}
        </button>

        {/* Avatar */}
        <button
          className="w-8 h-8 rounded-full bg-[#0066cc] flex items-center justify-center text-white text-[13px] font-semibold transition-transform active:scale-95"
          aria-label="Profile"
        >
          A
        </button>
      </div>
    </header>
  )
}
