"use client"

import { Menu, Bell, Search } from "lucide-react"
import { type NavTab } from "./sidebar"
import { useTenant } from "@/hooks/use-tenant"

const TAB_LABELS: Record<NavTab, string> = {
  overview:  "Overview",
  calls:     "Calls",
  shopify:   "Shopify",
  whatsapp:  "WhatsApp",
  wallet:    "Wallet",
  billing:   "Billing",
  profile:   "Settings",
}

interface HeaderProps {
  activeTab: NavTab
  onMobileMenuOpen: () => void
  notificationCount?: number
  onTabChange?: (tab: NavTab) => void
}

export function Header({ activeTab, onMobileMenuOpen, notificationCount = 0 }: HeaderProps) {
  const { tenant } = useTenant()

  const initials = tenant?.company_name
    ? tenant.company_name.slice(0, 2).toUpperCase()
    : "LA"

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#dddddd] px-4 lg:px-6 h-[64px] flex items-center justify-between gap-4">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 -ml-1 rounded-[8px] hover:bg-[#f7f7f7] text-[#6a6a6a]"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-semibold text-[#222222] tracking-tight leading-none">
          {TAB_LABELS[activeTab]}
        </h1>
      </div>

      {/* Right: search, bell, avatar */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-[8px] hover:bg-[#f7f7f7] text-[#929292] transition-colors"
          aria-label="Search"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>

        <button
          className="relative p-2 rounded-[8px] hover:bg-[#f7f7f7] text-[#929292] transition-colors"
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
        >
          <Bell className="w-[18px] h-[18px]" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff385c] rounded-full" />
          )}
        </button>

        {/* Avatar — Rausch background */}
        <button
          className="ml-1 w-8 h-8 rounded-full bg-[#ff385c] flex items-center justify-center text-white text-[12px] font-semibold transition-transform active:scale-95"
          aria-label="Profile"
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
