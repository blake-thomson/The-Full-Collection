"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Avatar } from "@/components/ui/Avatar";

interface ConversationMember {
  member_email: string;
  member_name: string | null;
  member_type: "client" | "team";
}

interface Conversation {
  id: string;
  name: string | null;
  type: "dm" | "group";
  client_id: string;
  members: ConversationMember[];
  last_message: { content: string; sender_email: string; sender_name: string | null; created_at: string } | null;
  unread_count: number;
  last_read_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_email: string;
  sender_name: string | null;
  sender_type: "client" | "team";
  content: string;
  reply_to_id: string | null;
  edited: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface Props {
  clientId: string;
  currentUser: { name: string; email: string; type: "client" | "team" };
}

const ROLE_COLOR: Record<string, string> = {
  owner: "#F59E0B", admin: "#FF3B3B", project_manager: "#3B82F6",
  editor: "#10B981", social_media_manager: "#8B5CF6", smm: "#8B5CF6", videographer: "#EC4899",
};

function formatRole(role: string) {
  if (role === "smm" || role === "social_media_manager") return "SMM";
  if (role === "project_manager") return "PM";
  if (role === "videographer") return "Video";
  return role;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isYesterday) return `Yesterday ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function DateSeparator({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const label = isToday ? "Today" : isYesterday ? "Yesterday"
    : d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-border" />
      <span className="text-text-3 text-[11px] font-semibold">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

export function ClientMessenger({ clientId, currentUser }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newType, setNewType] = useState<"dm" | "group">("dm");
  const [newName, setNewName] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingMsg, setEditingMsg] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [confirmDeleteConv, setConfirmDeleteConv] = useState<string | null>(null);
  const [deletingConv, setDeletingConv] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createBrowserSupabase();

  /* ── Load conversations ── */
  const loadConversations = useCallback(async () => {
    const res = await fetch(`/api/client-conversations?client_id=${clientId}`);
    if (res.ok) {
      const data: Conversation[] = await res.json();
      setConversations(data);
      if (!activeConv && data.length > 0) setActiveConv(data[0]);
    }
    setLoading(false);
  }, [clientId, activeConv]);

  useEffect(() => { loadConversations(); }, []);

  /* ── Load team members (for DM/group creation) ── */
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/team-members");
      if (res.ok) setTeamMembers(await res.json());
    })();
  }, []);

  /* ── Load messages ── */
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    const res = await fetch(`/api/client-messages?conversation_id=${convId}&limit=80`);
    if (res.ok) setMessages(await res.json());
    setLoadingMessages(false);
    fetch("/api/client-conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: convId, action: "read" }),
    });
  }, []);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
      setReplyTo(null);
    }
  }, [activeConv, loadMessages]);

  /* ── Real-time subscription ── */
  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`client_messages_${activeConv.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "client_messages",
        filter: `conversation_id=eq.${activeConv.id}`,
      }, async () => {
        const res = await fetch(`/api/client-messages?conversation_id=${activeConv.id}&limit=1`);
        if (res.ok) {
          const latest = await res.json();
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const newOnes = latest.filter((m: Message) => !ids.has(m.id));
            return [...prev, ...newOnes];
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv, supabase]);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send ── */
  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    setReplyTo(null);

    const res = await fetch("/api/client-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: activeConv.id,
        content,
        reply_to_id: replyTo?.id ?? null,
      }),
    });

    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, last_message: { content, sender_email: currentUser.email, sender_name: currentUser.name, created_at: msg.created_at }, unread_count: 0 }
            : c
        )
      );
    }
    setSending(false);
  };

  /* ── Edit ── */
  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await fetch("/api/client-messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content: editContent.trim() }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: editContent.trim(), edited: true } : m));
    setEditingMsg(null);
  };

  /* ── Delete (own messages only) ── */
  const deleteMessage = async (id: string) => {
    await fetch(`/api/client-messages?id=${id}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  /* ── Hide (others' messages) ── */
  const hideMessage = async (id: string) => {
    await fetch("/api/client-messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "hide" }),
    });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  /* ── Create conversation ── */
  const createConversation = async () => {
    if (creating) return;
    if (selectedEmails.length === 0) return;
    setCreating(true);

    const res = await fetch("/api/client-conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newType,
        name: newType === "group" ? (newName.trim() || null) : null,
        client_id: clientId,
        member_emails: selectedEmails,
      }),
    });

    if (res.ok) {
      const conv = await res.json();
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists ? prev.map((c) => c.id === conv.id ? conv : c) : [...prev, conv];
      });
      setActiveConv(conv);
      setShowNewModal(false);
      setNewName(""); setSelectedEmails([]);
      setMobileSidebarOpen(false);
    }
    setCreating(false);
  };

  /* ── Delete conversation (own DMs) ── */
  const deleteConversation = async (id: string) => {
    setDeletingConv(id);
    // Client can only delete conversations they created — we'll soft-delete via a PATCH
    // Actually for now we just remove from local state (full delete endpoint requires owner/admin)
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConv?.id === id) setActiveConv(null);
    setDeletingConv(null);
    setConfirmDeleteConv(null);
  };

  /* ── Display helpers ── */
  const getConvName = (conv: Conversation) => {
    if (conv.type === "dm") {
      const other = conv.members.find((m) => m.member_email !== currentUser.email);
      return other?.member_name ?? "DM";
    }
    return conv.name ?? "Group";
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === "dm") {
      const other = conv.members.find((m) => m.member_email !== currentUser.email);
      return other ? { name: other.member_name ?? "?" } : null;
    }
    return null;
  };

  const isGrouped = (msg: Message, prev: Message | undefined) => {
    if (!prev) return false;
    if (prev.sender_email !== msg.sender_email) return false;
    return new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;
  };

  const dms = conversations.filter((c) => c.type === "dm");
  const groups = conversations.filter((c) => c.type === "group");

  /* ── Sidebar ── */
  const ConvRow = ({ conv }: { conv: Conversation }) => {
    const name = getConvName(conv);
    const avatar = getConvAvatar(conv);
    const isActive = activeConv?.id === conv.id;
    const hasUnread = conv.unread_count > 0;

    return (
      <div className="relative group">
        <button
          onClick={() => { setActiveConv(conv); setMobileSidebarOpen(false); }}
          className={`w-full flex items-center gap-2.5 px-4 py-2 text-left border-none cursor-pointer transition-all font-body ${
            isActive ? "bg-red/10 text-red" : "bg-transparent text-text-2 hover:bg-surface-2 hover:text-text"
          }`}
        >
          {conv.type === "dm" && avatar ? (
            <Avatar name={avatar.name} size={24} />
          ) : (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? "bg-red/20 text-red" : "bg-surface-3 text-text-3"}`}>
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className={`flex-1 text-[13px] truncate ${hasUnread && !isActive ? "font-semibold text-text" : ""}`}>{name}</span>
          {conv.last_message && !hasUnread && (
            <span className="text-text-3 text-[10px] shrink-0">{timeAgo(conv.last_message.created_at)}</span>
          )}
          {hasUnread && !isActive && (
            <span className="bg-red text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {conv.unread_count > 99 ? "99+" : conv.unread_count}
            </span>
          )}
        </button>
        {confirmDeleteConv === conv.id ? (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
              disabled={deletingConv === conv.id}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-red/20 text-red border-none cursor-pointer font-body"
            >
              {deletingConv === conv.id ? "..." : "Delete"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDeleteConv(null); }}
              className="text-[10px] px-1.5 py-1 rounded bg-surface-2 text-text-3 border-none cursor-pointer font-body"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDeleteConv(conv.id); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer text-text-3 hover:text-red p-1 rounded transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="w-full h-full flex flex-col bg-surface border-r border-border">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-text font-heading font-bold text-[14px]">Messages</span>
          <button
            onClick={() => setShowNewModal(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-red/10 text-text-3 hover:text-red border-none cursor-pointer transition-colors"
            title="New conversation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Direct Messages */}
        <div className="mb-2">
          <div className="px-4 py-1.5 flex items-center justify-between">
            <span className="text-text-3 text-[10px] font-bold tracking-[0.12em] uppercase">Direct Messages</span>
            <button onClick={() => { setNewType("dm"); setShowNewModal(true); }} className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer p-0.5 rounded transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          {dms.length === 0 && (
            <button onClick={() => { setNewType("dm"); setShowNewModal(true); }} className="w-full px-4 py-2 text-left text-text-3 text-[12px] hover:text-text-2 bg-transparent border-none cursor-pointer transition-colors font-body">
              + Start a DM
            </button>
          )}
          {dms.map((conv) => <ConvRow key={conv.id} conv={conv} />)}
        </div>

        {/* Group Chats */}
        {groups.length > 0 && (
          <div className="mb-2">
            <div className="px-4 py-1.5 flex items-center justify-between">
              <span className="text-text-3 text-[10px] font-bold tracking-[0.12em] uppercase">Groups</span>
              <button onClick={() => { setNewType("group"); setShowNewModal(true); }} className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer p-0.5 rounded transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            {groups.map((conv) => <ConvRow key={conv.id} conv={conv} />)}
          </div>
        )}

        <div className="px-4 pt-2">
          <button
            onClick={() => { setNewType("group"); setShowNewModal(true); }}
            className="w-full py-2 px-3 rounded-lg text-text-3 text-[12px] hover:text-text-2 hover:bg-surface-2 bg-transparent border border-dashed border-border cursor-pointer transition-all font-body text-left"
          >
            + New group chat
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-3 text-[13px]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden" style={{ height: "100%" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-border overflow-hidden">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-[260px] h-full bg-surface shadow-2xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-text font-bold text-[14px]">Messages</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="bg-transparent border-none cursor-pointer text-text-3 p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden bg-transparent border-none cursor-pointer text-text-3 p-1 -ml-1 mr-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              {activeConv.type === "dm" && getConvAvatar(activeConv) ? (
                <Avatar name={getConvAvatar(activeConv)!.name} size={28} />
              ) : (
                <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-bold text-text-3">
                  {getConvName(activeConv).slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-text font-semibold text-[14px] truncate">{getConvName(activeConv)}</div>
                {activeConv.type !== "dm" && (
                  <div className="text-text-3 text-[11px]">{activeConv.members.length} member{activeConv.members.length !== 1 ? "s" : ""}</div>
                )}
              </div>

              {activeConv.type !== "dm" && activeConv.members.length > 0 && (
                <div className="hidden sm:flex items-center">
                  {activeConv.members.slice(0, 4).map((m, i) => (
                    <div key={m.member_email} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }}>
                      <Avatar name={m.member_name ?? m.member_email} size={24} />
                    </div>
                  ))}
                  {activeConv.members.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-[9px] font-bold text-text-3 -ml-2">
                      +{activeConv.members.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loadingMessages && (
                <div className="text-center text-text-3 text-[12px] py-4">Loading messages...</div>
              )}
              {!loadingMessages && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <div className="text-[32px]">{activeConv.type === "dm" ? "👋" : "💬"}</div>
                  <div className="text-text font-semibold text-[14px]">
                    {activeConv.type === "dm"
                      ? `This is the beginning of your DM with ${getConvName(activeConv)}`
                      : `Welcome to ${getConvName(activeConv)}`}
                  </div>
                  <div className="text-text-3 text-[12px]">Send the first message 👇</div>
                </div>
              )}

              {messages.map((msg, idx) => {
                const prev = messages[idx - 1];
                const grouped = isGrouped(msg, prev);
                const showDate = !prev || !isSameDay(prev.created_at, msg.created_at);
                const isOwn = msg.sender_email === currentUser.email;
                const senderName = msg.sender_name ?? msg.sender_email;
                const teamInfo = teamMembers.find((m) => m.email === msg.sender_email);

                return (
                  <div key={msg.id}>
                    {showDate && <DateSeparator iso={msg.created_at} />}
                    <div
                      className="group flex items-start gap-3 py-[2px] px-1 rounded-lg hover:bg-surface-2 transition-colors relative"
                      onMouseEnter={() => setHoveredMsg(msg.id)}
                      onMouseLeave={() => setHoveredMsg(null)}
                    >
                      <div className="w-8 shrink-0 pt-0.5">
                        {!grouped ? (
                          <Avatar name={senderName} size={32} src={teamInfo?.avatar_url} />
                        ) : (
                          <span className="invisible text-[10px] text-text-3 group-hover:visible">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {!grouped && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-text font-semibold text-[13px]">{senderName}</span>
                            {teamInfo?.role && (
                              <span className="text-[9px] font-bold tracking-[0.08em] uppercase py-[1px] px-[5px] rounded"
                                style={{ color: ROLE_COLOR[teamInfo.role] || "#A8A49C", background: `${ROLE_COLOR[teamInfo.role] || "#A8A49C"}18` }}>
                                {formatRole(teamInfo.role)}
                              </span>
                            )}
                            <span className="text-text-3 text-[11px]">{formatTime(msg.created_at)}</span>
                          </div>
                        )}

                        {msg.reply_to_id && (
                          <div className="flex items-start gap-1.5 mb-1 pl-2 border-l-2 border-border">
                            <span className="text-text-3 text-[11px] italic truncate">
                              {messages.find((m) => m.id === msg.reply_to_id)?.content ?? "Replied to a message"}
                            </span>
                          </div>
                        )}

                        {editingMsg === msg.id ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              autoFocus
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(msg.id);
                                if (e.key === "Escape") setEditingMsg(null);
                              }}
                              className="flex-1 tfc-input text-[13px] py-1"
                            />
                            <button onClick={() => saveEdit(msg.id)} className="tfc-btn text-xs py-1 px-3">Save</button>
                            <button onClick={() => setEditingMsg(null)} className="tfc-btn-ghost text-xs py-1 px-3">Cancel</button>
                          </div>
                        ) : (
                          <p className="text-text-2 text-[13px] leading-[1.6] m-0 whitespace-pre-wrap break-words">
                            {msg.content}
                            {msg.edited && <span className="text-text-3 text-[10px] ml-1">(edited)</span>}
                          </p>
                        )}
                      </div>

                      {hoveredMsg === msg.id && editingMsg !== msg.id && (
                        <div className="absolute right-2 top-1 flex items-center gap-0.5 bg-surface border border-border rounded-lg shadow-sm px-1 py-0.5">
                          <button
                            onClick={() => setReplyTo(msg)}
                            className="w-6 h-6 flex items-center justify-center rounded text-text-3 hover:text-text hover:bg-surface-2 bg-transparent border-none cursor-pointer transition-colors"
                            title="Reply"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 00-4-4H4" />
                            </svg>
                          </button>
                          {isOwn ? (
                            <>
                              <button
                                onClick={() => { setEditingMsg(msg.id); setEditContent(msg.content); }}
                                className="w-6 h-6 flex items-center justify-center rounded text-text-3 hover:text-text hover:bg-surface-2 bg-transparent border-none cursor-pointer transition-colors"
                                title="Edit"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="w-6 h-6 flex items-center justify-center rounded text-text-3 hover:text-red hover:bg-red/10 bg-transparent border-none cursor-pointer transition-colors"
                                title="Delete"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => hideMessage(msg.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-text-3 hover:text-text hover:bg-surface-2 bg-transparent border-none cursor-pointer transition-colors"
                              title="Hide from my view"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-surface-2 border border-border">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 shrink-0">
                    <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 00-4-4H4" />
                  </svg>
                  <span className="text-text-3 text-[11px] flex-1 truncate">
                    Replying to <strong className="text-text-2">{replyTo.sender_name ?? replyTo.sender_email}</strong>: {replyTo.content}
                  </span>
                  <button onClick={() => setReplyTo(null)} className="bg-transparent border-none cursor-pointer text-text-3 hover:text-text p-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    placeholder={`Message ${getConvName(activeConv)}...`}
                    rows={1}
                    style={{ resize: "none", minHeight: 42, maxHeight: 120 }}
                    className="tfc-textarea w-full text-[13px]"
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = Math.min(el.scrollHeight, 120) + "px";
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="shrink-0 flex items-center justify-center rounded-lg transition-all"
                  style={{
                    width: 44, height: 44,
                    background: input.trim() ? "#E02020" : "#1A1A1A",
                    color: input.trim() ? "#fff" : "#5A5652",
                    opacity: input.trim() ? 1 : 0.7,
                    border: "none", cursor: input.trim() ? "pointer" : "default",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <div className="text-text-3 text-[10px] mt-1 px-1">
                <kbd className="bg-surface-2 px-1 py-0.5 rounded text-[9px]">Enter</kbd> to send · <kbd className="bg-surface-2 px-1 py-0.5 rounded text-[9px]">Shift+Enter</kbd> for new line
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <div className="text-[48px]">💬</div>
            <div className="text-text font-heading font-bold text-[18px]">Messages</div>
            <div className="text-text-3 text-[13px] max-w-[280px]">Send a direct message or start a group chat with your team.</div>
            <button onClick={() => setShowNewModal(true)} className="tfc-btn mt-2">Start a conversation</button>
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden tfc-btn-ghost mt-1">View conversations</button>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-[440px] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-text font-heading font-bold text-[15px]">New Conversation</span>
              <button onClick={() => setShowNewModal(false)} className="bg-transparent border-none cursor-pointer text-text-3 hover:text-text p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                {(["dm", "group"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setNewType(t); setSelectedEmails([]); }}
                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-semibold border transition-all cursor-pointer font-body ${
                      newType === t
                        ? "bg-red/10 border-red/40 text-red"
                        : "bg-surface-2 border-border text-text-3 hover:text-text hover:border-border-2"
                    }`}
                  >
                    {t === "dm" ? "Direct Message" : "Group Chat"}
                  </button>
                ))}
              </div>

              {newType === "group" && (
                <div>
                  <label className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase block mb-1.5">Group name (optional)</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Content Team"
                    className="tfc-input w-full text-[13px]"
                  />
                </div>
              )}

              <div>
                <label className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase block mb-1.5">
                  {newType === "dm" ? "Select team member" : "Add team members"}
                </label>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {teamMembers.map((m) => {
                    const isSelected = selectedEmails.includes(m.email);
                    return (
                      <button
                        key={m.email}
                        onClick={() => {
                          if (newType === "dm") {
                            setSelectedEmails([m.email]);
                          } else {
                            setSelectedEmails((prev) =>
                              isSelected ? prev.filter((e) => e !== m.email) : [...prev, m.email]
                            );
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left border cursor-pointer transition-all font-body ${
                          isSelected
                            ? "bg-red/10 border-red/30 text-red"
                            : "bg-transparent border-border text-text-2 hover:bg-surface-2 hover:border-border-2"
                        }`}
                      >
                        <Avatar name={m.name} size={26} src={m.avatar_url} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium truncate">{m.name}</div>
                          <div className="text-[11px] text-text-3 truncate">{m.role}</div>
                        </div>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                  {teamMembers.length === 0 && (
                    <div className="text-text-3 text-[12px] py-4 text-center">No team members found</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowNewModal(false)} className="tfc-btn-ghost flex-1 py-2.5">Cancel</button>
              <button
                onClick={createConversation}
                disabled={creating || selectedEmails.length === 0}
                className="tfc-btn flex-1 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : newType === "dm" ? "Start DM" : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
