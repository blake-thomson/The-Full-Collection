"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Avatar } from "@/components/ui/Avatar";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface ConversationMember {
  member_email: string;
  team_members: { name: string; avatar_url?: string; role: string };
}

interface Conversation {
  id: string;
  name: string | null;
  type: "channel" | "dm" | "group";
  description?: string;
  is_default: boolean;
  members: ConversationMember[];
  last_message: { content: string; sender_email: string; created_at: string } | null;
  unread_count: number;
  last_read_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_email: string;
  content: string;
  reply_to_id: string | null;
  edited: boolean;
  created_at: string;
  updated_at: string;
  team_members: { name: string; avatar_url?: string; role: string } | null;
}

interface Props {
  currentUser: TeamMember;
}

const ROLE_COLOR: Record<string, string> = {
  owner: "#F59E0B", admin: "#FF3B3B", project_manager: "#3B82F6",
  editor: "#10B981", social_media_manager: "#8B5CF6", smm: "#8B5CF6",
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
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

export function TeamMessenger({ currentUser }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newType, setNewType] = useState<"channel" | "dm" | "group">("dm");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingMsg, setEditingMsg] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionCursor, setMentionCursor] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createBrowserSupabase();

  /* ── Load conversations ── */
  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/team-conversations");
    if (res.ok) {
      const data: Conversation[] = await res.json();
      setConversations(data);
      if (!activeConv && data.length > 0) {
        const general = data.find((c) => c.name === "general") ?? data[0];
        setActiveConv(general);
      }
    }
    setLoading(false);
  }, [activeConv]);

  useEffect(() => { loadConversations(); }, []);

  /* ── Load all team members (for DM creation + @mentions) ── */
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/team-members");
      if (res.ok) setAllMembers(await res.json());
    })();
  }, []);

  /* ── Load messages for active conversation ── */
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    const res = await fetch(`/api/team-messages?conversation_id=${convId}&limit=80`);
    if (res.ok) setMessages(await res.json());
    setLoadingMessages(false);
    // Mark as read
    fetch("/api/team-conversations", {
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
      .channel(`team_messages_${activeConv.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "team_messages",
        filter: `conversation_id=eq.${activeConv.id}`,
      }, async (payload) => {
        // Fetch the full message with member info
        const res = await fetch(`/api/team-messages?conversation_id=${activeConv.id}&limit=1`);
        if (res.ok) {
          const latest = await res.json();
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const newOnes = latest.filter((m: Message) => !ids.has(m.id));
            return [...prev, ...newOnes];
          });
        }
        // Mark read if it's from someone else
        if (payload.new.sender_email !== currentUser.email) {
          fetch("/api/team-conversations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversation_id: activeConv.id, action: "read" }),
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConv, currentUser.email, supabase]);

  /* ── Scroll to bottom on new messages ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── @mention detection ── */
  useEffect(() => {
    const match = input.match(/@(\w*)$/);
    if (match) {
      setMentionSearch(match[1].toLowerCase());
      setShowMentions(true);
      setMentionCursor(0);
    } else {
      setShowMentions(false);
    }
  }, [input]);

  const mentionMatches = allMembers.filter(
    (m) => m.email !== currentUser.email &&
      (m.name.toLowerCase().includes(mentionSearch) || m.email.toLowerCase().includes(mentionSearch))
  ).slice(0, 6);

  const insertMention = (member: TeamMember) => {
    const newInput = input.replace(/@\w*$/, `@${member.name.replace(/\s/g, "")} `);
    setInput(newInput);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  /* ── Send message ── */
  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    setReplyTo(null);

    const res = await fetch("/api/team-messages", {
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
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Update conversation's last message in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, last_message: { content, sender_email: currentUser.email, created_at: msg.created_at }, unread_count: 0 }
            : c
        )
      );
    }
    setSending(false);
  };

  /* ── Edit message ── */
  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await fetch("/api/team-messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content: editContent.trim() }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: editContent.trim(), edited: true } : m));
    setEditingMsg(null);
  };

  /* ── Delete message ── */
  const deleteMessage = async (id: string) => {
    await fetch(`/api/team-messages?id=${id}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  /* ── Create conversation ── */
  const createConversation = async () => {
    if (creating) return;
    if (newType === "channel" && !newName.trim()) return;
    if ((newType === "dm" || newType === "group") && selectedEmails.length === 0) return;
    setCreating(true);

    const res = await fetch("/api/team-conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newType,
        name: newType === "channel" ? newName.trim().toLowerCase().replace(/\s+/g, "-") : null,
        description: newDesc.trim() || null,
        member_emails: selectedEmails,
      }),
    });

    if (res.ok) {
      const conv = await res.json();
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists ? prev : [...prev, conv];
      });
      setActiveConv(conv);
      setShowNewModal(false);
      setNewName(""); setNewDesc(""); setSelectedEmails([]);
      setMobileSidebarOpen(false);
    }
    setCreating(false);
  };

  /* ── Conversation display name ── */
  const getConvName = (conv: Conversation) => {
    if (conv.type === "dm") {
      const other = conv.members.find((m) => m.member_email !== currentUser.email);
      return other?.team_members?.name ?? conv.name ?? "DM";
    }
    if (conv.type === "channel") return `# ${conv.name}`;
    return conv.name ?? "Group";
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === "dm") {
      const other = conv.members.find((m) => m.member_email !== currentUser.email);
      return other ? { name: other.team_members.name, src: other.team_members.avatar_url } : null;
    }
    return null;
  };

  /* ── Group messages by sender+time ── */
  const isGrouped = (msg: Message, prev: Message | undefined) => {
    if (!prev) return false;
    if (prev.sender_email !== msg.sender_email) return false;
    const diff = new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const channels = conversations.filter((c) => c.type === "channel");
  const dms = conversations.filter((c) => c.type === "dm");
  const groups = conversations.filter((c) => c.type === "group");

  const Sidebar = () => (
    <div className="w-full h-full flex flex-col bg-surface border-r border-border">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-text font-heading font-bold text-[14px]">Messenger</span>
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
        {/* Channels */}
        {channels.length > 0 && (
          <div className="mb-2">
            <div className="px-4 py-1.5 flex items-center justify-between">
              <span className="text-text-3 text-[10px] font-bold tracking-[0.12em] uppercase">Channels</span>
              <button onClick={() => { setNewType("channel"); setShowNewModal(true); }} className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer p-0.5 rounded transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            {channels.map((conv) => (
              <ConvRow key={conv.id} conv={conv} />
            ))}
          </div>
        )}

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

        {/* Start group chat CTA */}
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

  const ConvRow = ({ conv }: { conv: Conversation }) => {
    const name = getConvName(conv);
    const avatar = getConvAvatar(conv);
    const isActive = activeConv?.id === conv.id;
    const hasUnread = conv.unread_count > 0;

    return (
      <button
        onClick={() => { setActiveConv(conv); setMobileSidebarOpen(false); }}
        className={`w-full flex items-center gap-2.5 px-4 py-2 text-left border-none cursor-pointer transition-all font-body ${
          isActive ? "bg-red/10 text-red" : "bg-transparent text-text-2 hover:bg-surface-2 hover:text-text"
        }`}
      >
        {conv.type === "dm" && avatar ? (
          <Avatar name={avatar.name} size={24} src={avatar.src} />
        ) : conv.type === "channel" ? (
          <span className={`text-[14px] font-bold ${isActive ? "text-red" : "text-text-3"}`}>#</span>
        ) : (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? "bg-red/20 text-red" : "bg-surface-3 text-text-3"}`}>
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className={`flex-1 text-[13px] truncate ${hasUnread && !isActive ? "font-semibold text-text" : ""}`}>{name}</span>
        {hasUnread && !isActive && (
          <span className="bg-red text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {conv.unread_count > 99 ? "99+" : conv.unread_count}
          </span>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-3 text-[13px]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden" style={{ height: "100%" }}>
      {/* ── Sidebar (desktop) ── */}
      <div className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-border overflow-hidden">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-[260px] h-full bg-surface shadow-2xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-text font-bold text-[14px]">Messenger</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="bg-transparent border-none cursor-pointer text-text-3 p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeConv ? (
          <>
            {/* Chat header */}
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
                <Avatar name={getConvAvatar(activeConv)!.name} size={28} src={getConvAvatar(activeConv)!.src} />
              ) : activeConv.type === "channel" ? (
                <span className="text-text-2 text-[16px] font-bold">#</span>
              ) : (
                <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-bold text-text-3">
                  {getConvName(activeConv).slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-text font-semibold text-[14px] truncate">{getConvName(activeConv)}</div>
                {activeConv.description && (
                  <div className="text-text-3 text-[11px] truncate">{activeConv.description}</div>
                )}
                {activeConv.type !== "dm" && (
                  <div className="text-text-3 text-[11px]">{activeConv.members.length} member{activeConv.members.length !== 1 ? "s" : ""}</div>
                )}
              </div>

              {/* Members avatars */}
              {activeConv.type !== "dm" && activeConv.members.length > 0 && (
                <div className="hidden sm:flex items-center">
                  {activeConv.members.slice(0, 4).map((m, i) => (
                    <div key={m.member_email} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }}>
                      <Avatar name={m.team_members.name} size={24} src={m.team_members.avatar_url} />
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
                  <div className="text-[32px]">
                    {activeConv.type === "channel" ? "📣" : activeConv.type === "dm" ? "👋" : "💬"}
                  </div>
                  <div className="text-text font-semibold text-[14px]">
                    {activeConv.type === "dm"
                      ? `This is the beginning of your DM with ${getConvName(activeConv)}`
                      : activeConv.type === "channel"
                      ? `Welcome to #${activeConv.name}!`
                      : `Welcome to ${activeConv.name}`}
                  </div>
                  {activeConv.description && (
                    <div className="text-text-3 text-[12px] max-w-[300px]">{activeConv.description}</div>
                  )}
                  <div className="text-text-3 text-[12px]">Send the first message 👇</div>
                </div>
              )}

              {messages.map((msg, idx) => {
                const prev = messages[idx - 1];
                const grouped = isGrouped(msg, prev);
                const showDate = !prev || !isSameDay(prev.created_at, msg.created_at);
                const isOwn = msg.sender_email === currentUser.email;
                const senderName = msg.team_members?.name ?? msg.sender_email;
                const senderRole = msg.team_members?.role ?? "";

                return (
                  <div key={msg.id}>
                    {showDate && <DateSeparator iso={msg.created_at} />}
                    <div
                      className="group flex items-start gap-3 py-[2px] px-1 rounded-lg hover:bg-surface-2 transition-colors relative"
                      onMouseEnter={() => setHoveredMsg(msg.id)}
                      onMouseLeave={() => setHoveredMsg(null)}
                    >
                      {/* Avatar column */}
                      <div className="w-8 shrink-0 pt-0.5">
                        {!grouped ? (
                          <Avatar name={senderName} size={32} src={msg.team_members?.avatar_url} />
                        ) : (
                          <span className="invisible text-[10px] text-text-3 group-hover:visible">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {!grouped && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-text font-semibold text-[13px]">{senderName}</span>
                            {senderRole && (
                              <span className="text-[9px] font-bold tracking-[0.08em] uppercase py-[1px] px-[5px] rounded"
                                style={{ color: ROLE_COLOR[senderRole] || "#A8A49C", background: `${ROLE_COLOR[senderRole] || "#A8A49C"}18` }}>
                                {senderRole === "smm" ? "SMM" : senderRole === "social_media_manager" ? "SMM" : senderRole === "project_manager" ? "PM" : senderRole}
                              </span>
                            )}
                            <span className="text-text-3 text-[11px]">{formatTime(msg.created_at)}</span>
                          </div>
                        )}

                        {/* Reply context */}
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
                          <p className="text-text text-[13px] leading-relaxed m-0 whitespace-pre-wrap break-words">
                            {msg.content}
                            {msg.edited && <span className="text-text-3 text-[10px] ml-1">(edited)</span>}
                          </p>
                        )}
                      </div>

                      {/* Hover actions */}
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
                          {isOwn && (
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
              {/* Reply preview */}
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-surface-2 border border-border">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 shrink-0">
                    <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 00-4-4H4" />
                  </svg>
                  <span className="text-text-3 text-[11px] flex-1 truncate">
                    Replying to <strong className="text-text-2">{replyTo.team_members?.name ?? replyTo.sender_email}</strong>: {replyTo.content}
                  </span>
                  <button onClick={() => setReplyTo(null)} className="bg-transparent border-none cursor-pointer text-text-3 hover:text-text p-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              {/* @mention dropdown */}
              {showMentions && mentionMatches.length > 0 && (
                <div className="mb-2 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                  {mentionMatches.map((m, i) => (
                    <button
                      key={m.email}
                      onClick={() => insertMention(m)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left border-none cursor-pointer transition-colors font-body ${
                        i === mentionCursor ? "bg-red/10 text-red" : "bg-transparent text-text-2 hover:bg-surface-2"
                      }`}
                    >
                      <Avatar name={m.name} size={22} src={m.avatar_url} />
                      <span className="text-[12px] font-medium">{m.name}</span>
                      <span className="text-text-3 text-[11px]">{m.role}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (showMentions) {
                        if (e.key === "ArrowDown") { e.preventDefault(); setMentionCursor((c) => Math.min(c + 1, mentionMatches.length - 1)); return; }
                        if (e.key === "ArrowUp") { e.preventDefault(); setMentionCursor((c) => Math.max(c - 1, 0)); return; }
                        if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); if (mentionMatches[mentionCursor]) insertMention(mentionMatches[mentionCursor]); return; }
                        if (e.key === "Escape") { setShowMentions(false); return; }
                      }
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    placeholder={`Message ${getConvName(activeConv)}...`}
                    rows={1}
                    style={{ resize: "none", minHeight: 40, maxHeight: 120 }}
                    className="tfc-input w-full text-[13px] py-2.5 pr-10"
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
                  className="tfc-btn h-10 w-10 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed p-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <div className="text-text-3 text-[10px] mt-1 px-1">
                <kbd className="bg-surface-2 px-1 py-0.5 rounded text-[9px]">Enter</kbd> to send · <kbd className="bg-surface-2 px-1 py-0.5 rounded text-[9px]">Shift+Enter</kbd> for new line · @ to mention
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <div className="text-[48px]">💬</div>
            <div className="text-text font-heading font-bold text-[18px]">Team Messenger</div>
            <div className="text-text-3 text-[13px] max-w-[280px]">Select a conversation or start a new one to get the team talking.</div>
            <button onClick={() => setShowNewModal(true)} className="tfc-btn mt-2">Start a conversation</button>
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden tfc-btn-ghost mt-1">View conversations</button>
          </div>
        )}
      </div>

      {/* ── New Conversation Modal ── */}
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
              {/* Type selector */}
              <div className="flex gap-2">
                {(["dm", "group", "channel"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-semibold border transition-all cursor-pointer font-body ${
                      newType === t
                        ? "bg-red/10 border-red/40 text-red"
                        : "bg-surface-2 border-border text-text-3 hover:text-text hover:border-border-2"
                    }`}
                  >
                    {t === "dm" ? "Direct" : t === "group" ? "Group" : "Channel"}
                  </button>
                ))}
              </div>

              {/* Channel name */}
              {newType === "channel" && (
                <>
                  <div>
                    <label className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase block mb-1.5">Channel name</label>
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. content-review"
                      className="tfc-input w-full text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase block mb-1.5">Description (optional)</label>
                    <input
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What's this channel for?"
                      className="tfc-input w-full text-[13px]"
                    />
                  </div>
                </>
              )}

              {/* Group name */}
              {newType === "group" && (
                <div>
                  <label className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase block mb-1.5">Group name (optional)</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Design Team"
                    className="tfc-input w-full text-[13px]"
                  />
                </div>
              )}

              {/* Member selection */}
              <div>
                <label className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase block mb-1.5">
                  {newType === "dm" ? "Select person" : "Add members"}
                </label>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {allMembers.filter((m) => m.email !== currentUser.email).map((m) => {
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
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowNewModal(false)} className="tfc-btn-ghost flex-1 py-2.5">Cancel</button>
              <button
                onClick={createConversation}
                disabled={creating || (newType === "channel" && !newName.trim()) || ((newType === "dm" || newType === "group") && selectedEmails.length === 0)}
                className="tfc-btn flex-1 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : newType === "dm" ? "Start DM" : newType === "group" ? "Create Group" : "Create Channel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
