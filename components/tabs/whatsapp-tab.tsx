"use client"

import { useState } from "react"
import { Search, Send, MoreHorizontal, Phone, Users, ChevronRight, Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type WaSubTab = "chats" | "contacts"

interface WaChat {
  id: string
  name: string
  phone: string
  last_message: string
  last_time: string
  unread: number
  status: "active" | "bot" | "agent"
  avatar_initials: string
}

interface WaContact {
  subscriber_id: number
  chat_id: string
  first_name: string
  last_name: string
  phone: string
  label_names: string
  created_at: string
  assigned_agent: string | null
  bot_reply_label: string
}

interface WaMessage {
  id: string
  sender: "bot" | "user" | "agent"
  text: string
  time: string
  status?: "sent" | "delivered" | "read"
}

const WA_CHATS: WaChat[] = [
  { id: "c1", name: "Priya Sharma", phone: "+91 98765 43210", last_message: "Yes, I will pay on delivery", last_time: "10:32", unread: 0, status: "bot", avatar_initials: "PS" },
  { id: "c2", name: "Ravi Kumar", phone: "+91 87654 32109", last_message: "Okay, please send the link again", last_time: "10:28", unread: 2, status: "active", avatar_initials: "RK" },
  { id: "c3", name: "Anita Patel", phone: "+91 76543 21098", last_message: "Bot: Thank you! Your order is confirmed.", last_time: "10:18", unread: 0, status: "bot", avatar_initials: "AP" },
  { id: "c4", name: "Deepak Singh", phone: "+91 65432 10987", last_message: "Can you help me track my order?", last_time: "09:55", unread: 1, status: "agent", avatar_initials: "DS" },
  { id: "c5", name: "Meera Nair", phone: "+91 54321 09876", last_message: "Bot: Your cart has ₹2,499 waiting!", last_time: "09:40", unread: 0, status: "bot", avatar_initials: "MN" },
]

const WA_CONTACTS: WaContact[] = [
  { subscriber_id: 144, chat_id: "919876543210", first_name: "Priya", last_name: "Sharma", phone: "+91 98765 43210", label_names: "COD,Confirmed", created_at: "2026-06-20", assigned_agent: null, bot_reply_label: "Bot Reply On" },
  { subscriber_id: 145, chat_id: "918765432109", first_name: "Ravi", last_name: "Kumar", phone: "+91 87654 32109", label_names: "Cart,Recovery", created_at: "2026-07-01", assigned_agent: "Support Agent", bot_reply_label: "Bot Reply Off" },
  { subscriber_id: 146, chat_id: "917654321098", first_name: "Anita", last_name: "Patel", phone: "+91 76543 21098", label_names: "COD", created_at: "2026-07-03", assigned_agent: null, bot_reply_label: "Bot Reply On" },
  { subscriber_id: 147, chat_id: "916543210987", first_name: "Deepak", last_name: "Singh", phone: "+91 65432 10987", label_names: "Support", created_at: "2026-07-04", assigned_agent: "Support Agent", bot_reply_label: "Bot Reply Off" },
]

const MESSAGES: Record<string, WaMessage[]> = {
  c1: [
    { id: "m1", sender: "bot", text: "Hello Priya! Your order #10482 is ready for COD confirmation. Can we proceed?", time: "10:28", status: "read" },
    { id: "m2", sender: "user", text: "Yes, please confirm it.", time: "10:29" },
    { id: "m3", sender: "bot", text: "Great! Your COD order for Blue Cotton Kurta (₹1,299) is confirmed. We'll deliver in 3–5 days.", time: "10:29", status: "read" },
    { id: "m4", sender: "user", text: "Yes, I will pay on delivery", time: "10:32" },
  ],
  c2: [
    { id: "m1", sender: "bot", text: "Hi Ravi! You left something in your cart — Black Joggers (₹949). Ready to complete your purchase?", time: "10:22", status: "read" },
    { id: "m2", sender: "user", text: "Show me the link", time: "10:25" },
    { id: "m3", sender: "bot", text: "Here is your checkout link: https://store.example.com/checkout/ct_abc123", time: "10:26", status: "read" },
    { id: "m4", sender: "user", text: "Okay, please send the link again", time: "10:28" },
  ],
}

const STATUS_DOT: Record<WaChat["status"], string> = {
  active: "bg-[#34c759]",
  bot: "bg-[#0066cc]",
  agent: "bg-[#ff9500]",
}

export function WhatsAppTab() {
  const [subTab, setSubTab] = useState<WaSubTab>("chats")
  const [selectedChat, setSelectedChat] = useState<WaChat | null>(null)
  const [search, setSearch] = useState("")
  const [messageInput, setMessageInput] = useState("")

  const filteredChats = WA_CHATS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )
  const filteredContacts = WA_CONTACTS.filter(c =>
    !search || `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  const messages = selectedChat ? (MESSAGES[selectedChat.id] ?? []) : []

  return (
    <div className="bg-white rounded-2xl hairline overflow-hidden" style={{ height: "calc(100vh - 9rem)" }}>
      <div className="flex h-full">
        {/* Left panel */}
        <div className={cn(
          "flex flex-col border-r border-black/[0.08] w-full lg:w-80 shrink-0",
          selectedChat ? "hidden lg:flex" : "flex"
        )}>
          {/* Sub-tab + search */}
          <div className="p-3 border-b border-black/[0.06] space-y-2.5">
            <div className="flex gap-1 p-1 bg-[#f5f5f7] rounded-xl">
              {([["chats", "Chats", WA_CHATS.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0)], ["contacts", "Contacts", WA_CONTACTS.length]] as [WaSubTab, string, number][]).map(([id, label, count]) => (
                <button
                  key={id}
                  onClick={() => { setSubTab(id); setSelectedChat(null) }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all",
                    subTab === id ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"
                  )}
                >
                  {label}
                  {count > 0 && (
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", subTab === id ? "bg-[#0066cc] text-white" : "bg-[#6e6e73]/20 text-[#6e6e73]")}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-full px-3 py-2">
              <Search className="w-4 h-4 text-[#6e6e73] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="bg-transparent text-[13px] text-[#1d1d1f] outline-none w-full placeholder:text-[#6e6e73]"
              />
            </div>
          </div>

          {/* Chat list */}
          {subTab === "chats" && (
            <div className="flex-1 overflow-y-auto">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.04] hover:bg-[#f5f5f7] transition-colors text-left",
                    selectedChat?.id === chat.id && "bg-[#f5f5f7]"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-[13px] font-semibold text-[#0066cc]">
                      {chat.avatar_initials}
                    </div>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white", STATUS_DOT[chat.status])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-[#1d1d1f] truncate">{chat.name}</p>
                      <span className="text-[11px] text-[#6e6e73] shrink-0 ml-2">{chat.last_time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] text-[#6e6e73] truncate">{chat.last_message}</p>
                      {chat.unread > 0 && (
                        <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-[#34c759] flex items-center justify-center text-[10px] font-bold text-white">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Contacts list */}
          {subTab === "contacts" && (
            <div className="flex-1 overflow-y-auto">
              {filteredContacts.map((c) => (
                <div key={c.subscriber_id} className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.04] hover:bg-[#f5f5f7]">
                  <div className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[12px] font-semibold text-[#1d1d1f] shrink-0">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1d1d1f]">{c.first_name} {c.last_name}</p>
                    <p className="text-[11px] text-[#6e6e73]">{c.phone}</p>
                    {c.label_names && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {c.label_names.split(",").map((l) => (
                          <span key={l} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc]">{l}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#c7c7cc] shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation panel */}
        {selectedChat ? (
          <div className="flex flex-col flex-1 min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.08] bg-white">
              <button
                onClick={() => setSelectedChat(null)}
                className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-[#f5f5f7] text-[#6e6e73]"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-[12px] font-semibold text-[#0066cc]">
                  {selectedChat.avatar_initials}
                </div>
                <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white", STATUS_DOT[selectedChat.status])} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[#1d1d1f]">{selectedChat.name}</p>
                <p className="text-[11px] text-[#6e6e73]">{selectedChat.phone}</p>
              </div>
              <button className="p-2 rounded-xl hover:bg-[#f5f5f7] text-[#6e6e73]">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl hover:bg-[#f5f5f7] text-[#6e6e73]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f5f5f7]">
              {messages.map((msg) => {
                const isUser = msg.sender === "user"
                return (
                  <div key={msg.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] px-3.5 py-2.5 rounded-2xl",
                      isUser
                        ? "bg-[#0066cc] text-white rounded-br-sm"
                        : "bg-white text-[#1d1d1f] rounded-bl-sm hairline"
                    )}>
                      {!isUser && (
                        <p className={cn("text-[10px] font-semibold mb-1", msg.sender === "bot" ? "text-[#0066cc]" : "text-[#ff9500]")}>
                          {msg.sender === "bot" ? "Bot" : "Agent"}
                        </p>
                      )}
                      <p className="text-[13px] leading-relaxed">{msg.text}</p>
                      <div className={cn("flex items-center gap-1 mt-1", isUser ? "justify-end" : "justify-start")}>
                        <span className={cn("text-[10px]", isUser ? "text-white/70" : "text-[#6e6e73]")}>{msg.time}</span>
                        {isUser && msg.status && (
                          msg.status === "read"
                            ? <CheckCheck className="w-3 h-3 text-[#a8e6b6]" />
                            : <Check className="w-3 h-3 text-white/70" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-black/[0.08] bg-white flex items-center gap-2">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && messageInput.trim()) {
                    setMessageInput("")
                  }
                }}
                placeholder="Type a message…"
                className="flex-1 bg-[#f5f5f7] rounded-full px-4 py-2.5 text-[13px] text-[#1d1d1f] outline-none placeholder:text-[#6e6e73]"
              />
              <button
                onClick={() => setMessageInput("")}
                className="w-9 h-9 rounded-full bg-[#0066cc] flex items-center justify-center active:scale-95 transition-transform"
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
