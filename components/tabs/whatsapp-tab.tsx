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
  { bg: "#fff0f2", text: "#ff385c" },
  { bg: "#f0faf8", text: "#00a699" },
  { bg: "#f2f2f2", text: "#222222" },
  { bg: "#fff8f0", text: "#e87722" },
]
function avatarColor(name: string) {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export function WhatsAppTab() {
  const { tenant } = useTenant()
  const [subTab, setSubTab] = useState<WaSubTab>("chats")
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [is24hrBlocked, setIs24hrBlocked] = useState(false)
  const [chatPage, setChatPage] = useState(1)
  const [allChats, setAllChats] = useState<BotSailorChat[]>([])
  const [hasMoreChats, setHasMoreChats] = useState(true)
  const [chatFetchKey, setChatFetchKey] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const CHATS_PER_PAGE = 50

  const needsConfig = !tenant?.botsailor_api_key

  const { data: chatsData, isLoading: chatsLoading } = useSWR(
    !needsConfig && subTab === "chats"
      ? `/api/whatsapp/chats?page=${chatPage}&limit=${CHATS_PER_PAGE}&_k=${chatFetchKey}`
      : null,
    fetcher,
    { refreshInterval: chatPage === 1 ? 15000 : 0 }
  )
  const { data: contactsData, isLoading: contactsLoading } = useSWR(
    !needsConfig && subTab === "contacts"
      ? `/api/whatsapp/contacts${search ? `?search=${encodeURIComponent(search)}` : ""}`
      : null,
    fetcher
  )
  const { data: messagesData, isLoading: msgLoading } = useSWR(
    selectedPhone ? `/api/whatsapp/messages?phone_number=${encodeURIComponent(selectedPhone)}` : null,
    fetcher,
    { refreshInterval: 8000 }
  )

  // Accumulate pages — page 1 resets, subsequent pages append
  useEffect(() => {
    if (!chatsData) return
    const raw = chatsData?.message ?? chatsData?.data ?? chatsData?.chats
    // BotSailor returns error as string in message field
    if (!Array.isArray(raw)) {
      setHasMoreChats(false)
      return
    }
    const incoming: BotSailorChat[] = raw

    if (chatPage === 1) {
      setAllChats(incoming)
    } else {
      setAllChats(prev => {
        const existingIds = new Set(prev.map(c => String(c.subscriber_id ?? c.id)))
        const fresh = incoming.filter(c => !existingIds.has(String(c.subscriber_id ?? c.id)))
        return [...prev, ...fresh]
      })
    }

    if (incoming.length < CHATS_PER_PAGE) {
      setHasMoreChats(false)
    }
  }, [chatsData, chatPage])

  // Reset when switching sub-tabs
  useEffect(() => {
    setChatPage(1)
    setAllChats([])
    setHasMoreChats(true)
    setChatFetchKey(k => k + 1)
  }, [subTab])

  // Scroll-based pagination — guard with ref so we don't double-fire
  const loadingPageRef = useRef(false)
  const handleChatListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMoreChats || loadingPageRef.current || chatsLoading) return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      loadingPageRef.current = true
      setChatPage(p => p + 1)
    }
  }, [hasMoreChats, chatsLoading])

  // Reset scroll guard after page increment resolves (chatsData changes)
  useEffect(() => {
    loadingPageRef.current = false
  }, [chatsData])

  const chats = allChats
  const rawContacts = contactsData?.message ?? contactsData?.data ?? contactsData?.subscribers
  const contacts: BotSailorContact[] = Array.isArray(rawContacts) ? rawContacts : []
  const rawMessages = messagesData?.messages ?? messagesData?.data ?? messagesData?.message
  const messages: Message[] = Array.isArray(rawMessages) ? rawMessages : []

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Clear 24hr block when selecting a different chat
  useEffect(() => {
    setSendError(null)
    setIs24hrBlocked(false)
  }, [selectedId])

  async function handleSend() {
    if (!messageInput.trim() || !selectedPhone || sending) return
    setSending(true)
    setSendError(null)
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
        globalMutate(`/api/whatsapp/messages?phone_number=${encodeURIComponent(selectedPhone)}`)
      }
    } catch {
      setSendError("Network error. Please check your connection.")
    } finally {
      setSending(false)
    }
  }

  if (needsConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-[#f7f7f7] rounded-[14px] flex items-center justify-center mb-4 border border-[#dddddd]">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#929292]" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <h3 className="text-[15px] font-semibold text-[#222222]">BotSailor not configured</h3>
        <p className="text-[13px] text-[#6a6a6a] mt-1 max-w-xs">
          Add your BotSailor API key in Settings &rarr; Integrations to view chats.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[14px] border border-[#dddddd] overflow-hidden" style={{ height: "calc(100vh - 9rem)" }}>
      <div className="flex h-full">

        {/* ── Left panel: chat / contact list ── */}
        <div className={cn(
          "flex flex-col border-r border-[#dddddd] w-full lg:w-[300px] shrink-0",
          selectedId ? "hidden lg:flex" : "flex"
        )}>
          {/* Tabs + search */}
          <div className="p-3 border-b border-[#ebebeb] space-y-2.5">
            <div className="flex gap-1 p-1 bg-[#f7f7f7] rounded-[8px]">
              {([["chats", "Chats"], ["contacts", "Contacts"]] as [WaSubTab, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setSubTab(id); setSelectedId(null); setSelectedPhone(null); setSearch("") }}
                  className={cn(
                    "flex-1 py-2 rounded-[6px] text-[13px] font-medium transition-all",
                    subTab === id
                      ? "bg-white text-[#222222] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      : "text-[#6a6a6a]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-[#f7f7f7] rounded-full px-3 py-2 border border-[#ebebeb]">
              <Search className="w-3.5 h-3.5 text-[#929292] shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="bg-transparent text-[13px] text-[#222222] outline-none w-full placeholder:text-[#929292]"
              />
            </div>
          </div>

          {/* Error state */}
          {waError && (
            <div className="mx-3 mt-2 flex items-start gap-2 bg-[#fff8f0] border border-[#f59e0b]/30 rounded-[8px] px-3 py-2 text-[12px] text-[#92400e]">
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
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#ebebeb]">
                    <div className="w-10 h-10 rounded-full bg-[#f2f2f2] animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#f2f2f2] rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-[#f2f2f2] rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredChats.length === 0 && !chatsLoading ? (
                <div className="text-center py-12 text-[13px] text-[#929292]">
                  <MessageSquare className="w-8 h-8 text-[#dddddd] mx-auto mb-2" />
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
                      "w-full flex items-center gap-3 px-4 py-3 border-b border-[#ebebeb] hover:bg-[#f7f7f7] transition-colors text-left",
                      selectedId === sid && "bg-[#fff0f2]"
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
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-[#00a699]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-[#222222] truncate">{firstName} {lastName}</p>
                        <span className="text-[11px] text-[#929292] shrink-0 ml-2">
                          {chat.last_message_time
                            ? new Date(chat.last_message_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[12px] text-[#6a6a6a] truncate">{chat.last_message ?? chat.phone ?? ""}</p>
                        {unread > 0 && (
                          <span className="ml-2 shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff385c] flex items-center justify-center text-[10px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}

              {/* Pagination loader */}
              {chatsLoading && chatPage > 1 && (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!hasMoreChats && allChats.length > CHATS_PER_PAGE && (
                <p className="text-center text-[11px] text-[#929292] py-3">All conversations loaded</p>
              )}
            </div>
          )}

          {/* Contacts list */}
          {subTab === "contacts" && (
            <div className="flex-1 overflow-y-auto">
              {contactsLoading ? (
                [...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#ebebeb]">
                    <div className="w-9 h-9 rounded-full bg-[#f2f2f2] animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#f2f2f2] rounded animate-pulse w-2/3" />
                      <div className="h-2.5 bg-[#f2f2f2] rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                ))
              ) : contacts.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-[#929292]">No contacts found</div>
              ) : contacts.map(c => {
                const initials = getInitials(c.first_name, c.last_name)
                const av = avatarColor(initials)
                return (
                  <button
                    key={c.subscriber_id}
                    onClick={() => { setSelectedId(c.subscriber_id); setSelectedPhone(c.chat_id ?? c.phone ?? null) }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#ebebeb] hover:bg-[#f7f7f7] transition-colors text-left",
                      selectedId === c.subscriber_id && "bg-[#fff0f2]"
                    )}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
                      style={{ background: av.bg, color: av.text }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#222222]">{c.first_name} {c.last_name}</p>
                      <p className="text-[11px] text-[#6a6a6a]">{c.phone}</p>
                      {c.label_names && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {c.label_names.split(",").map(l => (
                            <span key={l} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#ff385c]/10 text-[#ff385c]">{l.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#dddddd] shrink-0" />
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
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#ebebeb] bg-white">
              <button
                onClick={() => { setSelectedId(null); setSelectedPhone(null) }}
                className="lg:hidden p-1.5 -ml-1 rounded-[6px] hover:bg-[#f7f7f7] text-[#6a6a6a]"
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
                <p className="text-[14px] font-semibold text-[#222222]">
                  {selectedPerson.first_name} {selectedPerson.last_name}
                </p>
                <p className="text-[11px] text-[#6a6a6a]">{selectedPhone}</p>
              </div>
              <button className="p-2 rounded-[8px] hover:bg-[#f7f7f7] text-[#929292]">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-[8px] hover:bg-[#f7f7f7] text-[#929292]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f7f7f7]">
              {msgLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messagesData?.error ? (
                <div className="flex items-center justify-center py-8 px-4 text-center">
                  <div>
                    <AlertCircle className="w-6 h-6 text-[#c13515] mx-auto mb-2" />
                    <p className="text-[13px] text-[#c13515]">{messagesData.error}</p>
                    <p className="text-[11px] text-[#929292] mt-1">Phone: {selectedPhone}</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-[13px] text-[#929292]">
                  No messages yet
                  {selectedPhone && <p className="text-[11px] text-[#929292] mt-1">Phone: {selectedPhone}</p>}
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
                        ? "bg-[#222222] text-white rounded-br-[4px]"
                        : "bg-white text-[#222222] rounded-bl-[4px] border border-[#dddddd]"
                    )}>
                      {!isUser && (
                        <p className="text-[10px] font-semibold text-[#ff385c] mb-1 uppercase tracking-wider">Bot / Agent</p>
                      )}
                      <p className="text-[13px] leading-relaxed">{text}</p>
                      <div className={cn("flex items-center gap-1 mt-1", isUser ? "justify-end" : "justify-start")}>
                        <span className={cn("text-[10px]", isUser ? "text-white/60" : "text-[#929292]")}>{time}</span>
                        {isUser && msg.status === "read"
                          ? <CheckCheck className="w-3 h-3 text-[#00a699]" />
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
              <div className="px-4 py-3 border-t border-[#ebebeb] bg-[#fffbeb] flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#92400e] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-[#92400e]">24-hour window closed</p>
                  <p className="text-[11px] text-[#78350f] mt-0.5">
                    WhatsApp only allows free-form messages within 24 hours of the last customer message.
                    You must send a pre-approved template message to reach this contact.
                  </p>
                </div>
                <button
                  onClick={() => { setIs24hrBlocked(false); setSendError(null) }}
                  className="text-[11px] text-[#92400e] underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Generic send error */}
            {sendError && !is24hrBlocked && (
              <div className="mx-4 mb-2 flex items-center gap-2 bg-[#fff0f2] border border-[#ff385c]/20 rounded-[8px] px-3 py-2 text-[12px] text-[#c13515]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {sendError}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-[#ebebeb] bg-white flex items-center gap-2">
              <input
                value={messageInput}
                onChange={e => { setMessageInput(e.target.value); if (sendError) setSendError(null) }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) handleSend()
                }}
                placeholder={is24hrBlocked ? "24-hour window closed — use a template" : "Type a message…"}
                disabled={is24hrBlocked}
                className={cn(
                  "flex-1 bg-[#f7f7f7] rounded-full px-4 py-2.5 text-[13px] text-[#222222] outline-none placeholder:text-[#929292] border border-[#ebebeb]",
                  is24hrBlocked && "opacity-50 cursor-not-allowed"
                )}
              />
              <button
                onClick={handleSend}
                disabled={!messageInput.trim() || sending || is24hrBlocked}
                className="w-9 h-9 rounded-full bg-[#ff385c] flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-[#f7f7f7]">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white border border-[#dddddd] flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-[#dddddd]" />
              </div>
              <p className="text-[15px] font-medium text-[#222222]">Select a conversation</p>
              <p className="text-[13px] text-[#6a6a6a] mt-1">Choose a chat from the left panel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
