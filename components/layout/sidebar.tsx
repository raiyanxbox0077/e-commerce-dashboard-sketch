"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import {
  LayoutDashboard,
  PhoneCall,
  ShoppingBag,
  MessageCircle,
  Wallet,
  CreditCard,
  User,
  ChevronRight,
  X,
  LogOut,
  Link2,
} from "lucide-react"

export type NavTab =
  | "overview"
  | "calls"
  | "shopify"
  | "whatsapp"
  | "wallet"
  | "billing"
  | "profile"

interface NavItem {
  id: NavTab
  label: string
  icon: React.ElementType
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview",  icon: LayoutDashboard },
  { id: "calls",    label: "Calls",     icon: PhoneCall },
  { id: "shopify",  label: "Shopify",   icon: ShoppingBag },
  { id: "whatsapp", label: "WhatsApp",  icon: MessageCircle },
]

const ACCOUNT_ITEMS: NavItem[] = [
  { id: "wallet",  label: "Wallet",  icon: Wallet },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "profile", label: "Settings", icon: User },
]

interface SidebarProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  walletBalance: number
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({
  activeTab,
  onTabChange,
  walletBalance,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const handleSelect = (tab: NavTab) => {
    onTabChange(tab)
    onMobileClose?.()
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-[220px] flex-col bg-card border-r border-hairline",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-[64px] border-b border-hairline">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="LarynxAI" width={28} height={28} className="rounded-lg" />
            <span className="text-[15px] font-semibold text-ink tracking-tight">LarynxAI</span>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface text-mute"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-3 mb-2 text-[11px] font-semibold text-faint uppercase tracking-widest">
            Main
          </p>
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => handleSelect(item.id)}
            />
          ))}

          <div className="pt-4">
            <p className="px-3 mb-2 text-[11px] font-semibold text-faint uppercase tracking-widest">
              Account
            </p>
            {ACCOUNT_ITEMS.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onClick={() => handleSelect(item.id)}
              />
            ))}
            {/* DEMO-ONLY: remove this link before production */}
            <Link
              href="/dashboard/connect"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13.5px] font-medium transition-all text-body hover:bg-surface hover:text-ink"
            >
              <Link2 className="w-4 h-4 shrink-0 text-faint" />
              <span className="flex-1 text-left">Connect Accounts</span>
            </Link>
          </div>
        </nav>

        {/* Wallet + Logout */}
        <div className="px-3 pb-4 space-y-1">
          <button
            onClick={() => handleSelect("wallet")}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-surface hover:bg-surface2 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Wallet className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-[11px] text-mute">Balance</p>
                <p className="text-[13px] font-semibold text-ink">
                  ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-faint" />
          </button>
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}

function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }
  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] text-[13px] font-medium text-dangertext hover:bg-accenttint transition-colors"
    >
      <LogOut className="w-4 h-4 shrink-0" />
      Sign Out
    </button>
  )
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13.5px] font-medium transition-all",
        active
          ? "bg-accenttint text-primary"
          : "text-body hover:bg-surface hover:text-ink"
      )}
    >
      <Icon
        className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-faint")}
      />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] font-semibold bg-primary text-white px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </button>
  )
}
