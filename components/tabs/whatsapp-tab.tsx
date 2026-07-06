"use client"

import { useState, useRef, useEffect } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { Search, Send, MoreHorizontal, Phone, Users, ChevronRight, Check, CheckCheck, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTenant } from "@/hooks/use-tenant"

const fetcher = (url: string) => fetch(url).then(r => r.json())

type WaSubTab = "chats" | "contacts"

interface BotSailorChat {
  id: string | number
  subscriber_id?: number
  chat_id?: string
  first_name?: string
  last_name?: string
  phone?: string
  last_message?: string
  last_message_time?: string
  unread_count?: number
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

const STATUS_DOT: Record<string, string> = {
  active:  "bg-[#34c759]",
  bot:     "bg-[#0066cc]",
  agent:   "bg-[#ff9500]",
}

function getInitials(first?: string, last?: string) {
  return `${(first ?? "?")[0] ?? ""}${(last ?? "")[0] ?? ""}`.toUpperCase()
}

export function WhatsAppTab() {
  const { tenant } = useTenant()
  const [subTab, setSubTab] = useState<WaSubTab>("chats")
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [chatPage, setChatPage] = useState(1)
  const [allChats, setAllChats] = useState<BotSailorChat[]>([])
  const [hasMoreChats, setHasMoreChats] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatListBottomRef = useRef<HTMLDivElement>(null)
  const CHATS_PER_PAGE = 20

  const needsConfig = !tenant?.botsailor_api_key

  const { data: chatsData, isLoading: chatsLoading } = useSWR(
    !needsConfig && subTab === "chats" ? `/api/whatsapp/chats?page=${chatPage}&limit=${CHATS_PER_PAGE}` : null,
    fetcher, { refreshInterval: chatPage === 1 ? 15000 : 0 }
  )
  const { data: contactsData, isLoading: contactsLoading } = useSWR(
    !needsConfig && subTab === "contacts"
      ? `/api/whatsapp/contacts${search ? `?search=${encodeURIComponent(search)}` : ""}`
      : null,
    fetcher
  )
  const { data: messagesData, isLoading: msgLoading } = useSWR(
    selectedPhone ? `/api/whatsapp/messages?phone_number=${encodeURIComponent(selectedPhone)}` : null,
    fetcher, { refreshInterval: 8000 }
  )

  // BotSailor returns { status: "1", message: [...] } — message can be a string on error, guard with isArray
  const rawChats = chatsData?.message ?? chatsData?.data ?? chatsData?.chats
  const newChats: BotSailorChat[] = Array.isArray(rawChats) ? rawChats : []

  // Accumulate chats across pages
  useEffect(() => {
    if (!newChats.length) {
      if (chatPage > 1) setHasMoreChats(false)
      return
    }
    if (chatPage === 1) {
      setAllChats(newChats)
    } else {
      setAllChats(prev => {
        const existingIds = new Set(prev.map(c => c.subscriber_id ?? c.id))
        const fresh = newChats.filter(c => !existingIds.has(c.subscriber_id ?? c.id))
        return [...prev, ...fresh]
      })
    }
    if (newChats.length < CHATS_PER_PAGE) setHasMoreChats(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatsData, chatPage])

  // Reset when switching sub-tabs or search changes
  useEffect(() => {
    setChatPage(1)
    setAllChats([])
    setHasMoreChats(true)
  }, [subTab, search])

  // IntersectionObserver at bottom of chat list to trigger next page
  useEffect(() => {
    const el = chatListBottomRef.current
    if (!el || !hasMoreChats) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !chatsLoading) {
        setChatPage(p => p + 1)
      }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMoreChats, chatsLoading])

  const chats = allChats
  const rawContacts = contactsData?.message ?? contactsData?.data ?? contactsData?.subscribers
  const contacts: BotSailorContact[] = Array.isArray(rawContacts) ? rawContacts : []
  // Route now returns { messages: [...] } — normalised array, no more numeric-keyed object
  const rawMessages = messagesData?.messages ?? messagesData?.data ?? messagesData?.message
  const messages: Message[] = Array.isArray(rawMessages) ? rawMessages : []
  // Error from BotSailor comes as message string when status != "1"
  const waError = (chatsData?.status === "0" || contactsData?.status === "0")
    ? (typeof chatsData?.message === "string" ? chatsData.message : typeof contactsData?.message === "string" ? contactsData.message : null)
    : chatsData?.error ?? contactsData?.error ?? null

  const filteredChats = search
    ? chats.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search))
    : chats

  const selectedChat = chats.find(c => c.subscriber_id === selectedId || c.id === selectedId)
  const selectedContact = contacts.find(c => c.subscriber_id === selectedId)
  const selectedPerson = selectedChat ?? selectedContact

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!messageInput.trim() || !selectedPhone || sending) return
    setSending(true)
    try {
      await fetch("/api/whatsapp/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: selectedPhone, message: messageInput.trim() }),
      })
      setMessageInput("")
      globalMutate(`/api/whatsapp/messages?phone_number=${encodeURIComponent(selectedPhone)}`)
    } finally {
      setSending(false)
    }
  }

  if (needsConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-4 border border-[rgba(0,0,0,0.08)]">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#c7c7cc]" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <h3 className="text-[15px] font-semibold text-[#1d1d1f]">BotSailor not configured</h3>
        <p className="text-[13px] text-[#6e6e73] mt-1 max-w-xs">
          Add your BotSailor API key in Profile &rarr; Integrations to view chats.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl hairline overflow-hidden" style={{ height: "calc(100vh - 9rem)" }}>
      <div className="flex h-full">
        {/* Left panel */}
        <div className={cn(
          "flex flex-col border-r border-black/[0.08] w-full lg:w-80 shrink-0",
          selectedId ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-3 border-b border-black/[0.06] space-y-2.5">
            <div className="flex gap-1 p-1 bg-[#f5f5f7] rounded-xl">
              {([["chats", "Chats"], ["contacts", "Contacts"]] as [WaSubTab, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setSubTab(id); setSelectedId(null); setSelectedPhone(null); setSearch("") }}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[13px] font-medium transition-all",
                    subTab === id ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3 py-2">
              <Search className="w-4 h-4 text-[#6e6e73] shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-full placeholder:text-[#6e6e73]"
              />
            </div>
          </div>

          {/* Error states */}
          {waError && (
            <div className="mx-3 mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-[12px] text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {waError}
            </div>
          )}

          {/* Chat list */}
          {subTab === "chats" && (
            <div className="flex-1 overflow-y-auto">
              {chatsLoading && chatPage === 1 ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.04]">
                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-[#6e6e73]">No chats found</div>
              ) : filteredChats.map(chat => {
                const sid = chat.subscriber_id ?? chat.id
                const firstName = chat.first_name ?? ""
                const lastName = chat.last_name ?? ""
                const unread = chat.unread_count ?? 0
                return (
                  <button
                    key={sid}
                    onClick={() => { setSelectedId(sid); setSelectedPhone(chat.chat_id ?? chat.phone ?? null) }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors text-left",
                      selectedId === sid && "bg-[#f5f5f7]"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-[13px] font-semibold text-[#0066cc]">
                        {getInitials(firstName, lastName)}
                      </div>
                      <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                        chat.bot_status === "on" ? STATUS_DOT.bot : STATUS_DOT.active
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-[#1d1d1f] truncate">{firstName} {lastName}</p>
                        <span className="text-[11px] text-[#6e6e73] shrink-0 ml-2">
                          {chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] text-[#6e6e73] truncate">{chat.last_message ?? chat.phone ?? ""}</p>
                        {unread > 0 && (
                          <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-[#34c759] flex items-center justify-center text-[10px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              {/* Scroll pagination sentinel */}
              <div ref={chatListBottomRef} className="h-4 shrink-0" />
              {chatsLoading && chatPage > 1 && (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!hasMoreChats && allChats.length > CHATS_PER_PAGE && (
                <p className="text-center text-[11px] text-[#c7c7cc] py-3">All conversations loaded</p>
              )}
            </div>
          )}

          {/* Contacts list */}
          {subTab === "contacts" && (
            <div className="flex-1 overflow-y-auto">
              {contactsLoading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.04]">
                    <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                ))
              ) : contacts.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-[#6e6e73]">No contacts found</div>
              ) : contacts.map(c => (
                <button
                  key={c.subscriber_id}
                  onClick={() => { setSelectedId(c.subscriber_id); setSelectedPhone(c.chat_id ?? c.phone ?? null) }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors text-left",
                    selectedId === c.subscriber_id && "bg-[#f5f5f7]"
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-[#f5f5f7] border border-[rgba(0,0,0,0.08)] flex items-center justify-center text-[12px] font-semibold text-[#1d1d1f] shrink-0">
                    {getInitials(c.first_name, c.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1d1d1f]">{c.first_name} {c.last_name}</p>
                    <p className="text-[11px] text-[#6e6e73]">{c.phone}</p>
                    {c.label_names && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {c.label_names.split(",").map(l => (
                          <span key={l} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc]">{l.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#c7c7cc] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation panel */}
        {selectedId && selectedPerson ? (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.08] bg-white">
              <button onClick={() => { setSelectedId(null); setSelectedPhone(null) }} className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-[#f5f5f7] text-[#6e6e73]">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-[12px] font-semibold text-[#0066cc] shrink-0">
                {getInitials(selectedPerson.first_name, selectedPerson.last_name)}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[#1d1d1f]">{selectedPerson.first_name} {selectedPerson.last_name}</p>
                <p className="text-[11px] text-[#6e6e73]">{selectedPerson.phone}</p>
              </div>
              <button className="p-2 rounded-xl hover:bg-[#f5f5f7] text-[#6e6e73]"><Phone className="w-4 h-4" /></button>
              <button className="p-2 rounded-xl hover:bg-[#f5f5f7] text-[#6e6e73]"><MoreHorizontal className="w-4 h-4" /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f5f5f7]">
              {msgLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messagesData?.error ? (
                <div className="flex items-center justify-center py-8 px-4 text-center">
                  <div>
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-[13px] text-red-600">{messagesData.error}</p>
                    <p className="text-[11px] text-[#6e6e73] mt-1">Phone: {selectedPhone}</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-[13px] text-[#6e6e73]">
                  No messages yet
                  {selectedPhone && <p className="text-[11px] text-[#6e6e73] mt-1">Phone: {selectedPhone}</p>}
                </div>
              ) : messages.map((msg, i) => {
                // BotSailor: sender is "subscriber" (customer) or "bot"/"agent"
                const rawMsg = msg as Record<string, unknown>
                // BotSailor: sender="user" means the customer, "bot"/"agent" means outbound
                const isUser = rawMsg.sender === "user" || rawMsg.sender === "subscriber" || msg.sender_type === "user" || msg.sender_type === "subscriber" || msg.direction === "incoming"
                // Route already extracts plain text into msg.message — just use it directly
                const raw = msg.message ?? msg.text ?? ""
                const text = typeof raw === "string" ? raw : typeof raw === "object" && raw !== null ? JSON.stringify(raw) : String(raw ?? "")
                const rawTime = (rawMsg.conversation_time as string | undefined) ?? msg.created_at
                const time = rawTime ? new Date(rawTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : (msg.time ?? "")
                return (
                  <div key={msg.id ?? i} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] px-3.5 py-2.5 rounded-2xl",
                      isUser ? "bg-[#0066cc] text-white rounded-br-sm" : "bg-white text-[#1d1d1f] rounded-bl-sm hairline"
                    )}>
                      {!isUser && (
                        <p className="text-[10px] font-semibold text-[#0066cc] mb-1">Bot / Agent</p>
                      )}
                      <p className="text-[13px] leading-relaxed">{text}</p>
                      <div className={cn("flex items-center gap-1 mt-1", isUser ? "justify-end" : "justify-start")}>
                        <span className={cn("text-[10px]", isUser ? "text-white/70" : "text-[#6e6e73]")}>{time}</span>
                        {isUser && msg.status === "read"
                          ? <CheckCheck className="w-3 h-3 text-[#a8e6b6]" />
                          : isUser ? <Check className="w-3 h-3 text-white/70" /> : null}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-black/[0.08] bg-white flex items-center gap-2">
              <input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) handleSend()
                }}
                placeholder="Type a message…"
                className="flex-1 bg-[#f5f5f7] rounded-full px-4 py-2.5 text-[13px] text-[#1d1d1f] outline-none placeholder:text-[#6e6e73]"
              />
              <button
                onClick={handleSend}
                disabled={!messageInput.trim() || sending}
                className="w-9 h-9 rounded-full bg-[#0066cc] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-[#f5f5f7]">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white hairline flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-[#c7c7cc]" />
              </div>
              <p className="text-[15px] font-medium text-[#1d1d1f]">Select a conversation</p>
              <p className="text-[13px] text-[#6e6e73] mt-1">Choose a chat from the left panel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
