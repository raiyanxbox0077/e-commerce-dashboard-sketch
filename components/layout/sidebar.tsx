"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
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
  Zap,
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
  { id: "profile", label: "Profile", icon: User },
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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-[220px] flex-col bg-white border-r border-black/[0.06]",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold text-[#1A1A1A] tracking-tight">LarynxAI</span>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#F2F0EB] text-[#6B7280]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
          <p className="px-3 mb-2 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest">
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

          <div className="pt-5">
            <p className="px-3 mb-2 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest">
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
          </div>
        </nav>

        {/* Wallet + Logout */}
        <div className="px-3 pb-5 space-y-1.5">
          <button
            onClick={() => handleSelect("wallet")}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-[#F2F0EB] hover:bg-[#E8EDEA] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Wallet className="w-4 h-4 text-[#2D6A4F]" />
              <div className="text-left">
                <p className="text-[11px] text-[#6B7280]">Balance</p>
                <p className="text-[13px] font-semibold text-[#1A1A1A]">
                  ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
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
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-[#DC2626] hover:bg-[#DC2626]/8 transition-colors"
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
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all",
        active
          ? "bg-[#2D6A4F]/10 text-[#2D6A4F]"
          : "text-[#374151] hover:bg-[#F2F0EB] hover:text-[#1A1A1A]"
      )}
    >
      <Icon
        className={cn("w-4 h-4 shrink-0", active ? "text-[#2D6A4F]" : "text-[#9CA3AF]")}
      />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] font-semibold bg-[#2D6A4F] text-white px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </button>
  )
}
