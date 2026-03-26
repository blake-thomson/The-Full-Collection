"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  client_id: string;
  sender_email: string;
  sender_name: string;
  sender_type: "client" | "team";
  content: string;
  created_at: string;
}

interface CurrentUser {
  name: string;
  email: string;
  type: "client" | "team";
}

interface Props {
  clientId: string;
  currentUser: CurrentUser;
}

export function MessageThread({ clientId, currentUser }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?client_id=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      setError("Failed to load messages.");
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setSending(true);
    setInput("");

    // Optimistic add
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      client_id: clientId,
      sender_email: currentUser.email,
      sender_name: currentUser.name,
      sender_type: currentUser.type,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          sender_email: currentUser.email,
          sender_name: currentUser.name,
          sender_type: currentUser.type,
          content: text,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => prev.map((m) => m.id === optimisticMsg.id ? saved : m));
      }
    } catch (err) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInput(text);
      setError("Failed to send message. Please try again.");
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const getDateSeparator = (dateStr: string, prevDateStr?: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const dayStr = d.toDateString();

    if (prevDateStr) {
      const prev = new Date(prevDateStr);
      if (prev.toDateString() === dayStr) return null;
    }

    if (dayStr === now.toDateString()) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dayStr === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A49C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h3 className="text-text font-heading text-[15px] font-bold m-0">Messages</h3>
        <span className="text-text-3 text-[12px]">{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading && (
          <div className="text-text-3 text-[13px] text-center py-10">Loading messages...</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-text-3 text-[13px] text-center py-16">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-30">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            No messages yet. Start the conversation below.
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_type === currentUser.type;
          const dateSep = getDateSeparator(msg.created_at, i > 0 ? messages[i - 1].created_at : undefined);

          return (
            <div key={msg.id}>
              {dateSep && (
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase shrink-0">{dateSep}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] sm:max-w-[60%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className="text-text-2 text-[11px] font-semibold">{msg.sender_name}</span>
                    <span className="text-text-3 text-[10px]">{formatTime(msg.created_at)}</span>
                  </div>
                  <div
                    className="rounded-xl px-3.5 py-2.5 text-[13px] leading-[1.55]"
                    style={{
                      background: isMe
                        ? (currentUser.type === "client" ? "#E02020" : "#202020")
                        : "#181818",
                      color: isMe && currentUser.type === "client" ? "#ffffff" : "#F0EDE6",
                      borderBottomRightRadius: isMe ? 4 : 12,
                      borderBottomLeftRadius: isMe ? 12 : 4,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {showTyping && (
          <div className="flex justify-start mb-3">
            <div className="bg-surface-2 rounded-xl px-4 py-3 text-text-3 text-[13px]">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-text-3 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-3 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-3 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 sm:px-6 py-2 shrink-0">
          <p className="text-[#EF4444] text-[12px] m-0">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border px-4 py-3 sm:px-6 sm:py-4 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            className="tfc-textarea flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ minHeight: 42, maxHeight: 120, resize: "none" }}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            className="tfc-btn shrink-0"
            style={{ padding: "10px 20px", fontSize: 12 }}
            onClick={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
