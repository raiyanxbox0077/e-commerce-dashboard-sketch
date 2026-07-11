"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { Search, Send, MoreHorizontal, Phone, Users, ChevronRight, Check, CheckCheck, AlertCircle, Clock, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTenant } from "@/hooks/use-tenant"

const fetcher = (url: string) => fetch(url).then(r => r.json())

type WaSubTab = "chats" | "contacts"

interface BotSailorChat {
  id?: string | number
  subscriber_id?: number
  chat_id?: string          // BotSailor phone number e.g. "919923542625"
  first_name?: string
  last_name?: string
  phone?: string
  last_message?: string
  last_message_time?: string
  unread_count?: number
  unseen_count?: number
  bot_status?: string
}

interface BotSailorContact {
  subscriber_id: number
  chat_id?: string
  first_name?: string
  last_name?: string
  phone?: string
  label_names?: string
  created_at?: string
  assigned_agent?: string | null
  bot_reply_label?: string
}

interface Message {
  id: string | number
  sender_type?: string
  direction?: string
  message?: string
  text?: string
  created_at?: string
  time?: string
  status?: string
}

function getInitials(first?: string, last?: string) {
  return `${(first ?? "?")[0] ?? ""}${(last ?? "")[0] ?? ""}`.toUpperCase()
}

// Avatar colours based on initials — Airbnb palette
const AVATAR_COLORS = [
  { bg: "var(--accenttint)", text: "var(--primary)" },
  { bg: "var(--tealtint)", text: "var(--teal)" },
  { bg: "var(--surface2)", text: "var(--ink)" },
  { bg: "var(--warntint)", text: "var(--warn)" },
]
function avatarColor(name: string) {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// DEMO DATA — safe to delete after demo
const DEMO_CHATS: BotSailorChat[] = [
  {
    id: "demo-1",
    subscriber_id: 9001,
    chat_id: "919876543210",
    first_name: "Ravi",
    last_name: "Kumar",
    phone: "+91 98765 43210",
    last_message: "Yes, please confirm my order.",
    last_message_time: "2026-07-11T08:45:00.000Z",
    unread_count: 0,
    unseen_count: 0,
    bot_status: "on",
  },
  {
    id: "demo-2",
    subscriber_id: 9002,
    chat_id: "919123456789",
    first_name: "Priya",
    last_name: "Sharma",
    phone: "+91 91234 56789",
    last_message: "Confirmed. Thank you!",
    last_message_time: "2026-07-11T09:12:00.000Z",
    unread_count: 0,
    unseen_count: 0,
    bot_status: "on",
  },
  {
    id: "demo-3",
    subscriber_id: 9003,
    chat_id: "919880012345",
    first_name: "Amit",
    last_name: "Patel",
    phone: "+91 88001 23456",
    last_message: "I need help with my order status.",
    last_message_time: "2026-07-11T10:30:00.000Z",
    unread_count: 1,
    unseen_count: 1,
    bot_status: "on",
  },
  {
    id: "demo-4",
    subscriber_id: 9004,
    chat_id: "919770098876",
    first_name: "Sneha",
    last_name: "Reddy",
    phone: "+91 77009 88765",
    last_message: "Hi, I left items in my cart. Any discount?",
    last_message_time: "2026-07-10T18:20:00.000Z",
    unread_count: 0,
    unseen_count: 0,
    bot_status: "on",
  },
  {
    id: "demo-5",
    subscriber_id: 9005,
    chat_id: "919988766554",
    first_name: "Vikram",
    last_name: "Singh",
    phone: "+91 99887 66554",
    last_message: "Please cancel my COD order.",
    last_message_time: "2026-07-10T14:05:00.000Z",
    unread_count: 0,
    unseen_count: 0,
    bot_status: "on",
  },
  {
    id: "demo-6",
    subscriber_id: 9006,
    chat_id: "919909090808",
    first_name: "Ananya",
    last_name: "Iyer",
    phone: "+91 90909 80808",
    last_message: "Got it, thanks for the update.",
    last_message_time: "2026-07-10T11:50:00.000Z",
    unread_count: 0,
    unseen_count: 0,
    bot_status: "on",
  },
]

const DEMO_MESSAGES: Record<string, Message[]> = {
  "919876543210": [
    { id: "d1m1", sender_type: "agent", direction: "outgoing", message: "Hi Ravi, this is LarynxAI calling about your order #1001. Can you please confirm if you want to proceed?", text: "Hi Ravi, this is LarynxAI calling about your order #1001. Can you please confirm if you want to proceed?", created_at: "2026-07-11T08:42:00.000Z", time: "08:42", status: "read" },
    { id: "d1m2", sender_type: "user", direction: "incoming", message: "Yes, I want the order. Please confirm it.", text: "Yes, I want the order. Please confirm it.", created_at: "2026-07-11T08:43:00.000Z", time: "08:43" },
    { id: "d1m3", sender_type: "agent", direction: "outgoing", message: "Thank you! Your COD order #1001 has been confirmed and will be dispatched today.", text: "Thank you! Your COD order #1001 has been confirmed and will be dispatched today.", created_at: "2026-07-11T08:44:00.000Z", time: "08:44", status: "read" },
    { id: "d1m4", sender_type: "user", direction: "incoming", message: "Yes, please confirm my order.", text: "Yes, please confirm my order.", created_at: "2026-07-11T08:45:00.000Z", time: "08:45" },
  ],
  "919123456789": [
    { id: "d2m1", sender_type: "agent", direction: "outgoing", message: "Hello Priya, your order #1002 is ready for COD confirmation. Shall we proceed?", text: "Hello Priya, your order #1002 is ready for COD confirmation. Shall we proceed?", created_at: "2026-07-11T09:08:00.000Z", time: "09:08", status: "read" },
    { id: "d2m2", sender_type: "user", direction: "incoming", message: "Yes, confirm it.", text: "Yes, confirm it.", created_at: "2026-07-11T09:09:00.000Z", time: "09:09" },
    { id: "d2m3", sender_type: "agent", direction: "outgoing", message: "Confirmed! Your order #1002 will reach you by Friday. Thank you for shopping with us.", text: "Confirmed! Your order #1002 will reach you by Friday. Thank you for shopping with us.", created_at: "2026-07-11T09:10:00.000Z", time: "09:10", status: "read" },
    { id: "d2m4", sender_type: "user", direction: "incoming", message: "Confirmed. Thank you!", text: "Confirmed. Thank you!", created_at: "2026-07-11T09:12:00.000Z", time: "09:12" },
  ],
  "919880012345": [
    { id: "d3m1", sender_type: "user", direction: "incoming", message: "Hi, I need help with my order status.", text: "Hi, I need help with my order status.", created_at: "2026-07-11T10:28:00.000Z", time: "10:28" },
    { id: "d3m2", sender_type: "agent", direction: "outgoing", message: "Hi Amit, I can help with that. Your order #1003 is currently pending COD confirmation. Would you like me to confirm it?", text: "Hi Amit, I can help with that. Your order #1003 is currently pending COD confirmation. Would you like me to confirm it?", created_at: "2026-07-11T10:29:00.000Z", time: "10:29", status: "read" },
    { id: "d3m3", sender_type: "user", direction: "incoming", message: "Yes, please confirm. Also when will it be delivered?", text: "Yes, please confirm. Also when will it be delivered?", created_at: "2026-07-11T10:30:00.000Z", time: "10:30" },
    { id: "d3m4", sender_type: "agent", direction: "outgoing", message: "Done! Order #1003 is confirmed. Expected delivery: 14 July 2026.", text: "Done! Order #1003 is confirmed. Expected delivery: 14 July 2026.", created_at: "2026-07-11T10:31:00.000Z", time: "10:31", status: "read" },
  ],
  "919770098876": [
    { id: "d4m1", sender_type: "agent", direction: "outgoing", message: "Hi Sneha, you left Cotton Kurta and Wireless Earbuds in your cart. Complete your order now and get 10% off with code SAVE10.", text: "Hi Sneha, you left Cotton Kurta and Wireless Earbuds in your cart. Complete your order now and get 10% off with code SAVE10.", created_at: "2026-07-10T18:15:00.000Z", time: "18:15", status: "read" },
    { id: "d4m2", sender_type: "user", direction: "incoming", message: "Hi, I left items in my cart. Any discount?", text: "Hi, I left items in my cart. Any discount?", created_at: "2026-07-10T18:20:00.000Z", time: "18:20" },
    { id: "d4m3", sender_type: "agent", direction: "outgoing", message: "Yes! Use code SAVE10 for 10% off your cart. The offer expires in 24 hours.", text: "Yes! Use code SAVE10 for 10% off your cart. The offer expires in 24 hours.", created_at: "2026-07-10T18:21:00.000Z", time: "18:21", status: "read" },
  ],
  "919988766554": [
    { id: "d5m1", sender_type: "agent", direction: "outgoing", message: "Hi Vikram, your COD order #1005 is pending confirmation. Can you please confirm?", text: "Hi Vikram, your COD order #1005 is pending confirmation. Can you please confirm?", created_at: "2026-07-10T14:02:00.000Z", time: "14:02", status: "read" },
    { id: "d5m2", sender_type: "user", direction: "incoming", message: "Please cancel my COD order.", text: "Please cancel my COD order.", created_at: "2026-07-10T14:05:00.000Z", time: "14:05" },
    { id: "d5m3", sender_type: "agent", direction: "outgoing", message: "Understood. I have cancelled order #1005. You will not be charged.", text: "Understood. I have cancelled order #1005. You will not be charged.", created_at: "2026-07-10T14:06:00.000Z", time: "14:06", status: "read" },
  ],
  "919909090808": [
    { id: "d6m1", sender_type: "user", direction: "incoming", message: "Where is my order #1008?", text: "Where is my order #1008?", created_at: "2026-07-10T11:47:00.000Z", time: "11:47" },
    { id: "d6m2", sender_type: "agent", direction: "outgoing", message: "Hi Ananya, order #1008 has been dispatched and is out for delivery today. Tracking: DEL123456789.", text: "Hi Ananya, order #1008 has been dispatched and is out for delivery today. Tracking: DEL123456789.", created_at: "2026-07-10T11:48:00.000Z", time: "11:48", status: "read" },
    { id: "d6m3", sender_type: "user", direction: "incoming", message: "Got it, thanks for the update.", text: "Got it, thanks for the update.", created_at: "2026-07-10T11:50:00.000Z", time: "11:50" },
  ],
}

export function WhatsAppTab() {
  const { tenant } = useTenant()
  const isDemo = !tenant?.botsailor_api_key
  const [subTab, setSubTab] = useState<WaSubTab>("chats")
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [is24hrBlocked, setIs24hrBlocked] = useState(false)
  const [chatPage, setChatPage] = useState(1)
  const [allChats, setAllChats] = useState<BotSailorChat[]>(() => isDemo ? [...DEMO_CHATS] : [])
  const [hasMoreChats, setHasMoreChats] = useState(!isDemo)
  const [chatFetchKey, setChatFetchKey] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const CHATS_PER_PAGE = 20

  // BotSailor's subscriber list ignores offset (offset >= limit returns nothing),
  // so infinite scroll works by growing the `limit` and re-fetching from offset 0.
  const requestedLimit = chatPage * CHATS_PER_PAGE
  const { data: chatsData, isLoading: chatsLoading, isValidating: chatsValidating } = useSWR(
    !isDemo && subTab === "chats"
      ? `/api/whatsapp/chats?page=1&limit=${requestedLimit}&_k=${chatFetchKey}`
      : null,
    fetcher,
    { refreshInterval: 15000, keepPreviousData: true }
  )
  const { data: contactsData, isLoading: contactsLoading } = useSWR(
    !isDemo && subTab === "contacts"
      ? `/api/whatsapp/contacts${search ? `?search=${encodeURIComponent(search)}` : ""}`
      : null,
    fetcher
  )
  const { data: messagesData, isLoading: msgLoading } = useSWR(
    !isDemo && selectedPhone ? `/api/whatsapp/messages?phone_number=${encodeURIComponent(selectedPhone)}` : null,
    fetcher,
    { refreshInterval: 8000 }
  )

  // Each fetch returns a superset (limit grows with chatPage), so we replace the
  // whole list. If we got fewer rows than requested, there are no more chats.
  useEffect(() => {
    if (isDemo) {
      const sorted = [...DEMO_CHATS].sort((a, b) => {
        const ta = new Date(a.last_message_time ?? 0).getTime()
        const tb = new Date(b.last_message_time ?? 0).getTime()
        return tb - ta
      })
      setAllChats(sorted)
      setHasMoreChats(false)
      return
    }
    if (!chatsData) return
    const raw = chatsData?.message ?? chatsData?.data ?? chatsData?.chats
    // BotSailor returns error as string in message field
    if (!Array.isArray(raw)) {
      setHasMoreChats(false)
      return
    }
    const sorted = [...(raw as BotSailorChat[])].sort((a, b) => {
      const ta = new Date(a.last_message_time ?? 0).getTime()
      const tb = new Date(b.last_message_time ?? 0).getTime()
      return tb - ta
    })
    setAllChats(sorted)
    setHasMoreChats(raw.length >= requestedLimit)
  }, [chatsData, requestedLimit, isDemo])

  // Reset when switching sub-tabs
  useEffect(() => {
    setChatPage(1)
    setAllChats(isDemo ? [...DEMO_CHATS] : [])
    setHasMoreChats(!isDemo)
    setChatFetchKey(k => k + 1)
  }, [subTab, isDemo])

  // Scroll-based pagination — guard with ref so we don't double-fire
  const loadingPageRef = useRef(false)
  const handleChatListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMoreChats || loadingPageRef.current || chatsValidating) return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      loadingPageRef.current = true
      setChatPage(p => p + 1)
    }
  }, [hasMoreChats, chatsValidating])

  // Reset scroll guard after page increment resolves (chatsData changes)
  useEffect(() => {
    loadingPageRef.current = false
  }, [chatsData])

  const chats = allChats
  const rawContacts = contactsData?.message ?? contactsData?.data ?? contactsData?.subscribers
  const contacts: BotSailorContact[] = Array.isArray(rawContacts) ? rawContacts : []
  const demoMessages = selectedPhone ? (DEMO_MESSAGES[selectedPhone] ?? []) : []
  const rawMessages = isDemo ? demoMessages : (messagesData?.messages ?? messagesData?.data ?? messagesData?.message)
  const messages: Message[] = Array.isArray(rawMessages)
    ? [...rawMessages].sort((a, b) => {
        const ta = new Date((a as Record<string, unknown>).conversation_time as string ?? a.created_at ?? 0).getTime()
        const tb = new Date((b as Record<string, unknown>).conversation_time as string ?? b.created_at ?? 0).getTime()
        return ta - tb
      })
    : []

  // Error: only show when allChats is empty after load (not during pagination)
  const waError = allChats.length === 0 && !chatsLoading
    ? (chatsData?.error
        ?? (typeof chatsData?.message === "string" ? chatsData.message : null)
        ?? (contactsData?.error ?? (typeof contactsData?.message === "string" ? contactsData.message : null)))
    : null

  const filteredChats = search
    ? chats.filter(c =>
        `${c.first_name ?? ""} ${c.last_name ?? ""}`.toLowerCase().includes(search.toLowerCase()) ||
        (c.chat_id ?? c.phone ?? "").includes(search)
      )
    : chats

  const selectedChat = chats.find(c => c.subscriber_id === selectedId || c.id === selectedId)
  const selectedContact = contacts.find(c => c.subscriber_id === selectedId)
  const selectedPerson = selectedChat ?? selectedContact

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" })
    }
  }, [selectedPhone, messages])

  // Clear 24hr block when selecting a different chat
  useEffect(() => {
    setSendError(null)
    setIs24hrBlocked(false)
  }, [selectedId])

  async function handleSend() {
    if (!messageInput.trim() || !selectedPhone || sending) return
    setSending(true)
    setSendError(null)

    if (isDemo) {
      const text = messageInput.trim()
      setMessageInput("")
      const optimistic: Message = {
        id: `demo-sent-${Date.now()}`,
        sender_type: "agent",
        direction: "outgoing",
        message: text,
        text,
        created_at: new Date().toISOString(),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: "sent",
      }
      if (!DEMO_MESSAGES[selectedPhone]) DEMO_MESSAGES[selectedPhone] = []
      DEMO_MESSAGES[selectedPhone].push(optimistic)
      globalMutate(`/api/whatsapp/messages?phone_number=${encodeURIComponent(selectedPhone)}`, (prev: any) => {
        const messages = prev?.messages ?? DEMO_MESSAGES[selectedPhone] ?? []
        return { ...prev, messages: [...messages, optimistic] }
      }, false)
      setSending(false)
      return
    }

    try {
      const res = await fetch("/api/whatsapp/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: selectedPhone, message: messageInput.trim() }),
      })
      const data = await res.json()
      // BotSailor 24-hour window error detection
      const errMsg: string = data?.message ?? data?.error ?? ""
      if (
        errMsg.toLowerCase().includes("24 hour") ||
        errMsg.toLowerCase().includes("24-hour") ||
        errMsg.toLowerCase().includes("outside") ||
        errMsg.toLowerCase().includes("template")
      ) {
        setIs24hrBlocked(true)
        setSendError("Sending outside the 24-hour window is not allowed by WhatsApp. You can only send template messages to this contact.")
      } else if (!res.ok || (data?.status !== undefined && String(data.status) !== "1")) {
        setSendError(errMsg || "Failed to send message. Please try again.")
      } else {
        setMessageInput("")
        const optimistic: Message = {
          id: `optimistic-${Date.now()}`,
          sender_type: "agent",
          direction: "outgoing",
          message: messageInput.trim(),
          text: messageInput.trim(),
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          status: "sent",
        }
        globalMutate(`/api/whatsapp/messages?phone_number=${encodeURIComponent(selectedPhone)}`, (prev: any) => {
          if (!prev || !Array.isArray(prev.messages)) return prev
          return { ...prev, messages: [...prev.messages, optimistic] }
        }, false)
        globalMutate(`/api/whatsapp/messages?phone_number=${encodeURIComponent(selectedPhone)}`)
      }
    } catch {
      setSendError("Network error. Please check your connection.")
    } finally {
      setSending(false)
    }
  }



  return (
    <div className="bg-card rounded-[14px] border border-hairline overflow-hidden" style={{ height: "calc(100vh - 9rem)" }}>
      <div className="flex h-full">

        {/* ── Left panel: chat / contact list ── */}
        <div className={cn(
          "flex flex-col border-r border-hairline w-full lg:w-[300px] shrink-0",
          selectedId ? "hidden lg:flex" : "flex"
        )}>
          {/* Tabs + search */}
          <div className="p-3 border-b border-hair2 space-y-2.5">
            <div className="flex gap-1 p-1 bg-surface rounded-[8px]">
              {([["chats", "Chats"], ["contacts", "Contacts"]] as [WaSubTab, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setSubTab(id); setSelectedId(null); setSelectedPhone(null); setSearch("") }}
                  className={cn(
                    "flex-1 py-2 rounded-[6px] text-[13px] font-medium transition-all",
                    subTab === id
                      ? "bg-card text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      : "text-mute"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-surface rounded-full px-3 py-2 border border-hair2">
              <Search className="w-3.5 h-3.5 text-faint shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="bg-transparent text-[13px] text-ink outline-none w-full placeholder:text-faint"
              />
            </div>
          </div>

          {/* Error state */}
          {waError && (
            <div className="mx-3 mt-2 flex items-start gap-2 bg-warntint border border-warn/30 rounded-[8px] px-3 py-2 text-[12px] text-warntext">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{waError}</span>
            </div>
          )}

          {/* Chat list */}
          {subTab === "chats" && (
            <div
              className="flex-1 overflow-y-auto"
              onScroll={handleChatListScroll}
            >
              {chatsLoading && chatPage === 1 && allChats.length === 0 ? (
                // Skeleton only on first load
                [...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-hair2">
                    <div className="w-10 h-10 rounded-full bg-surface2 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-surface2 rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-surface2 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredChats.length === 0 && !chatsLoading ? (
                <div className="text-center py-12 text-[13px] text-faint">
                  <MessageSquare className="w-8 h-8 text-hairline mx-auto mb-2" />
                  {search ? "No chats match your search" : "No chats found"}
                </div>
              ) : filteredChats.map(chat => {
                const sid = chat.subscriber_id ?? chat.id
                const firstName = chat.first_name ?? ""
                const lastName = chat.last_name ?? ""
                const unread = chat.unseen_count ?? chat.unread_count ?? 0
                const initials = getInitials(firstName, lastName)
                const av = avatarColor(initials)
                return (
                  <button
                    key={sid}
                    onClick={() => { setSelectedId(sid); setSelectedPhone(chat.chat_id ?? chat.phone ?? null) }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 border-b border-hair2 hover:bg-surface transition-colors text-left",
                      selectedId === sid && "bg-accenttint"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold"
                        style={{ background: av.bg, color: av.text }}
                      >
                        {initials}
                      </div>
                      {chat.bot_status === "on" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-teal" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-ink truncate">{firstName} {lastName}</p>
                        <span className="text-[11px] text-faint shrink-0 ml-2">
                          {chat.last_message_time
                            ? new Date(chat.last_message_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[12px] text-mute truncate">{chat.last_message ?? chat.phone ?? ""}</p>
                        {unread > 0 && (
                          <span className="ml-2 shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}

              {/* Pagination loader */}
              {chatsValidating && chatPage > 1 && hasMoreChats && (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!hasMoreChats && allChats.length > CHATS_PER_PAGE && (
                <p className="text-center text-[11px] text-faint py-3">All conversations loaded</p>
              )}
            </div>
          )}

          {/* Contacts list */}
          {subTab === "contacts" && (
            <div className="flex-1 overflow-y-auto">
              {contactsLoading ? (
                [...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-hair2">
                    <div className="w-9 h-9 rounded-full bg-surface2 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-surface2 rounded animate-pulse w-2/3" />
                      <div className="h-2.5 bg-surface2 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                ))
              ) : contacts.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-faint">No contacts found</div>
              ) : contacts.map(c => {
                const initials = getInitials(c.first_name, c.last_name)
                const av = avatarColor(initials)
                return (
                  <button
                    key={c.subscriber_id}
                    onClick={() => { setSelectedId(c.subscriber_id); setSelectedPhone(c.chat_id ?? c.phone ?? null) }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 border-b border-hair2 hover:bg-surface transition-colors text-left",
                      selectedId === c.subscriber_id && "bg-accenttint"
                    )}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
                      style={{ background: av.bg, color: av.text }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-ink">{c.first_name} {c.last_name}</p>
                      <p className="text-[11px] text-mute">{c.phone}</p>
                      {c.label_names && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {c.label_names.split(",").map(l => (
                            <span key={l} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{l.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-hairline shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Conversation panel ── */}
        {selectedId && selectedPerson ? (
          <div className="flex flex-col flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-hair2 bg-card">
              <button
                onClick={() => { setSelectedId(null); setSelectedPhone(null) }}
                className="lg:hidden p-1.5 -ml-1 rounded-[6px] hover:bg-surface text-mute"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              {(() => {
                const initials = getInitials(selectedPerson.first_name, selectedPerson.last_name)
                const av = avatarColor(initials)
                return (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
                    style={{ background: av.bg, color: av.text }}
                  >
                    {initials}
                  </div>
                )
              })()}
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-ink">
                  {selectedPerson.first_name} {selectedPerson.last_name}
                </p>
                <p className="text-[11px] text-mute">{selectedPhone}</p>
              </div>
              <button className="p-2 rounded-[8px] hover:bg-surface text-faint">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-[8px] hover:bg-surface text-faint">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface">
              {msgLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messagesData?.error ? (
                <div className="flex items-center justify-center py-8 px-4 text-center">
                  <div>
                    <AlertCircle className="w-6 h-6 text-dangertext mx-auto mb-2" />
                    <p className="text-[13px] text-dangertext">{messagesData.error}</p>
                    <p className="text-[11px] text-faint mt-1">Phone: {selectedPhone}</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-[13px] text-faint">
                  No messages yet
                  {selectedPhone && <p className="text-[11px] text-faint mt-1">Phone: {selectedPhone}</p>}
                </div>
              ) : messages.map((msg, i) => {
                const rawMsg = msg as Record<string, unknown>
                const isUser = rawMsg.sender === "user" || rawMsg.sender === "subscriber"
                  || msg.sender_type === "user" || msg.sender_type === "subscriber"
                  || msg.direction === "incoming"
                const raw = msg.message ?? msg.text ?? ""
                const text = typeof raw === "string" ? raw
                  : typeof raw === "object" && raw !== null ? JSON.stringify(raw)
                  : String(raw ?? "")
                const rawTime = (rawMsg.conversation_time as string | undefined) ?? msg.created_at
                const time = rawTime
                  ? new Date(rawTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                  : (msg.time ?? "")
                return (
                  <div key={msg.id ?? i} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] px-3.5 py-2.5 rounded-[14px]",
                      isUser
                        ? "bg-ink text-white rounded-br-[4px] dark:bg-[#1f1f1f] dark:text-white"
                        : "bg-card text-ink rounded-bl-[4px] border border-hairline dark:bg-[#1f1f1f] dark:text-white"
                    )}>
                      {!isUser && (
                        <p className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wider">Bot / Agent</p>
                      )}
                      <p className="text-[13px] leading-relaxed dark:text-white">{text}</p>
                      <div className={cn("flex items-center gap-1 mt-1", isUser ? "justify-end" : "justify-start")}>
                        <span className={cn("text-[10px]", isUser ? "text-white/60" : "text-faint dark:text-white/60")}>{time}</span>
                        {isUser && msg.status === "read"
                          ? <CheckCheck className="w-3 h-3 text-teal" />
                          : isUser ? <Check className="w-3 h-3 text-white/60" /> : null}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* 24-hour window warning banner */}
            {is24hrBlocked && (
              <div className="px-4 py-3 border-t border-hair2 bg-warntint flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-warntext mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-warntext">24-hour window closed</p>
                  <p className="text-[11px] text-warntext mt-0.5">
                    WhatsApp only allows free-form messages within 24 hours of the last customer message.
                    You must send a pre-approved template message to reach this contact.
                  </p>
                </div>
                <button
                  onClick={() => { setIs24hrBlocked(false); setSendError(null) }}
                  className="text-[11px] text-warntext underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Generic send error */}
            {sendError && !is24hrBlocked && (
              <div className="mx-4 mb-2 flex items-center gap-2 bg-accenttint border border-primary/20 rounded-[8px] px-3 py-2 text-[12px] text-dangertext">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {sendError}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-hair2 bg-card flex items-center gap-2">
              <input
                value={messageInput}
                onChange={e => { setMessageInput(e.target.value); if (sendError) setSendError(null) }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) handleSend()
                }}
                placeholder={is24hrBlocked ? "24-hour window closed — use a template" : "Type a message…"}
                disabled={is24hrBlocked}
                className={cn(
                  "flex-1 bg-surface rounded-full px-4 py-2.5 text-[13px] text-ink outline-none placeholder:text-faint border border-hair2",
                  is24hrBlocked && "opacity-50 cursor-not-allowed"
                )}
              />
              <button
                onClick={handleSend}
                disabled={!messageInput.trim() || sending || is24hrBlocked}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-surface">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-card border border-hairline flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-hairline" />
              </div>
              <p className="text-[15px] font-medium text-ink">Select a conversation</p>
              <p className="text-[13px] text-mute mt-1">Choose a chat from the left panel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
