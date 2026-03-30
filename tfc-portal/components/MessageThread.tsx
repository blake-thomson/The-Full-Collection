"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ─── Types ─── */
interface Message {
  id: string;
  client_id: string;
  sender_email: string;
  sender_name: string;
  sender_type: "client" | "team";
  content: string;
  created_at: string;
  thread_parent_id: string | null;
  message_type: "text" | "voice" | "support";
  mentions: string[];
  voice_url: string | null;
  voice_duration: number | null;
  reply_count?: number;
}

interface CurrentUser {
  name: string;
  email: string;
  type: "client" | "team";
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  clientId: string;
  currentUser: CurrentUser;
  clientName?: string;
}

/* ─── Helpers ─── */
function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getDateSeparator(dateStr: string, prevDateStr?: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const dayStr = d.toDateString();
  if (prevDateStr && new Date(prevDateStr).toDateString() === dayStr) return null;
  if (dayStr === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayStr === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function shouldGroup(msg: Message, prev: Message | undefined): boolean {
  if (!prev) return false;
  if (prev.sender_email !== msg.sender_email) return false;
  const diff = new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime();
  return diff < 5 * 60 * 1000;
}

function renderMentions(text: string) {
  const parts = text.split(/(@\w[\w\s]*?)(?=\s|$|@)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} style={{ color: "var(--color-red)", fontWeight: 700 }}>{part}</span>
      );
    }
    return part;
  });
}

function renderContent(text: string, type: string) {
  // Render newlines
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {type === "text" || type === "support" ? renderMentions(line) : line}
      {i < lines.length - 1 && <br />}
    </span>
  ));
}

/* ─── Voice Player ─── */
function VoicePlayer({ url, duration }: { url: string; duration: number | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const totalDuration = duration || 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && isFinite(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => { audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("ended", onEnd); };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); } else { audio.play(); }
    setPlaying(!playing);
  };

  const changeSpeed = () => {
    const speeds = [1, 1.5, 2, 2.5, 3];
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "var(--color-red)", minWidth: 32, minHeight: 32 }}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-1.5 rounded-full cursor-pointer" style={{ background: "#2A2A2A" }} onClick={seek}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--color-red)" }} />
        </div>
        <div className="flex justify-between text-[10px]" style={{ color: "#6B6560" }}>
          <span>{fmt(currentTime)}</span>
          <span>{fmt(totalDuration)}</span>
        </div>
      </div>
      <button
        onClick={changeSpeed}
        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
        style={{ background: "#1A1A1A", color: "#A8A49C", minWidth: 32, minHeight: 24 }}
      >
        {speed}x
      </button>
    </div>
  );
}

/* ─── Help Form ─── */
function HelpForm({ onSubmit, onCancel }: { onSubmit: (subject: string, desc: string, priority: string) => void; onCancel: () => void }) {
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("Medium");

  return (
    <div className="rounded-xl p-4" style={{ background: "#1A1600", border: "1px solid #3D3500" }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 16 }}>&#127915;</span>
        <span className="font-heading font-bold text-[14px]" style={{ color: "#F0EDE6" }}>New Support Ticket</span>
      </div>
      <input
        className="tfc-input mb-2"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{ fontSize: 13 }}
      />
      <textarea
        className="tfc-textarea mb-2"
        placeholder="Describe the issue..."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={3}
        style={{ fontSize: 13, minHeight: 60 }}
      />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] font-semibold" style={{ color: "#A8A49C" }}>Priority:</span>
        {["Low", "Medium", "High"].map((p) => (
          <button
            key={p}
            onClick={() => setPriority(p)}
            className="px-3 py-1 rounded text-[11px] font-bold"
            style={{
              background: priority === p ? (p === "High" ? "var(--color-red)" : p === "Medium" ? "#F59E0B" : "#3B82F6") : "#1A1A1A",
              color: priority === p ? "#fff" : "#A8A49C",
              minHeight: 28,
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          className="tfc-btn"
          style={{ padding: "8px 16px", fontSize: 11 }}
          onClick={() => { if (subject.trim()) onSubmit(subject, desc, priority); }}
          disabled={!subject.trim()}
        >
          Submit Ticket
        </button>
        <button className="tfc-btn-ghost" style={{ padding: "8px 16px", fontSize: 11 }} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Mention Picker ─── */
function MentionPicker({
  query,
  members,
  clientName,
  clientEmail,
  onSelect,
}: {
  query: string;
  members: TeamMember[];
  clientName: string;
  clientEmail: string;
  onSelect: (name: string, email: string) => void;
}) {
  const all = useMemo(() => {
    const list = members.map((m) => ({ name: m.name, email: m.email, role: m.role }));
    if (clientName && clientEmail) {
      list.push({ name: clientName, email: clientEmail, role: "client" });
    }
    return list;
  }, [members, clientName, clientEmail]);

  const filtered = all.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.email.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-0 mb-1 w-64 rounded-lg shadow-lg overflow-hidden z-50"
      style={{ background: "#1A1A1A", border: "1px solid #252525" }}
    >
      {filtered.slice(0, 6).map((m) => (
        <button
          key={m.email}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#252525] transition-colors"
          style={{ minHeight: 40 }}
          onClick={() => onSelect(m.name, m.email)}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: "var(--color-red)", color: "#fff" }}
          >
            {m.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: "#F0EDE6" }}>{m.name}</div>
            <div className="text-[10px] truncate" style={{ color: "#6B6560" }}>{m.role}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── Message Input ─── */
function MessageInput({
  onSend,
  onSendVoice,
  teamMembers,
  clientName,
  clientEmail,
  placeholder,
}: {
  onSend: (content: string, mentions: string[], messageType?: string) => void;
  onSendVoice: (base64: string, duration: number) => void;
  teamMembers: TeamMember[];
  clientName: string;
  clientEmail: string;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionEmails, setMentionEmails] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordTimeRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Check for @mention trigger
    const cursor = e.target.selectionStart || 0;
    const textBefore = val.slice(0, cursor);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setShowMentions(true);
      setMentionQuery(atMatch[1]);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string, email: string) => {
    const cursor = textareaRef.current?.selectionStart || input.length;
    const textBefore = input.slice(0, cursor);
    const atIdx = textBefore.lastIndexOf("@");
    const before = input.slice(0, atIdx);
    const after = input.slice(cursor);
    setInput(before + "@" + name + " " + after);
    setMentionEmails((prev) => [...prev, email]);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    if (text === "/help") {
      setShowHelp(true);
      setInput("");
      return;
    }

    onSend(text, mentionEmails);
    setInput("");
    setMentionEmails([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleHelpSubmit = (subject: string, desc: string, priority: string) => {
    const content = `\uD83C\uDFAB Support Ticket: ${subject}\n${desc}\nPriority: ${priority}`;
    onSend(content, [], "support");
    setShowHelp(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      recordTimeRef.current = 0;
      setRecording(true);
      setRecordTime(0);

      timerRef.current = setInterval(() => {
        recordTimeRef.current += 1;
        setRecordTime(recordTimeRef.current);
      }, 1000);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        const finalDuration = recordTimeRef.current;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onSendVoice(base64, finalDuration);
        };
        reader.readAsDataURL(blob);
        setRecording(false);
        setRecordTime(0);
      };

      mediaRecorder.start();
    } catch {
      // Microphone permission denied
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (showHelp) {
    return (
      <div className="border-t px-4 py-3 sm:px-6 sm:py-4 shrink-0" style={{ borderColor: "#1A1A1A" }}>
        <HelpForm onSubmit={handleHelpSubmit} onCancel={() => setShowHelp(false)} />
      </div>
    );
  }

  if (recording) {
    return (
      <div className="border-t px-4 py-3 sm:px-6 sm:py-4 shrink-0" style={{ borderColor: "#1A1A1A" }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--color-red)" }} />
          <span className="text-[13px] font-semibold" style={{ color: "var(--color-red)" }}>Recording {fmtTime(recordTime)}</span>
          <div className="flex-1" />
          <button
            onClick={stopRecording}
            className="tfc-btn"
            style={{ padding: "8px 20px", fontSize: 11 }}
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t px-4 py-3 sm:px-6 sm:py-4 shrink-0" style={{ borderColor: "#1A1A1A" }}>
      <div className="relative">
        {showMentions && (
          <MentionPicker
            query={mentionQuery}
            members={teamMembers}
            clientName={clientName}
            clientEmail={clientEmail}
            onSelect={insertMention}
          />
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="tfc-textarea flex-1"
            value={input}
            onChange={handleChange}
            onInput={autoResize}
            placeholder={placeholder || "Message #general..."}
            style={{ minHeight: 42, maxHeight: 120, resize: "none" }}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
              if (e.key === "Escape") setShowMentions(false);
            }}
          />
          <button
            onClick={startRecording}
            className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 44, height: 44, background: "#1A1A1A", color: "#A8A49C" }}
            title="Record voice message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <button
            className="shrink-0 flex items-center justify-center rounded-lg transition-opacity"
            style={{
              width: 44,
              height: 44,
              background: input.trim() ? "var(--color-red)" : "#1A1A1A",
              color: input.trim() ? "#fff" : "#5A5652",
              opacity: input.trim() ? 1 : 0.5,
            }}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Single Message Row ─── */
function MessageRow({
  msg,
  grouped,
  onReply,
  onViewThread,
  onDelete,
  onHide,
  currentUserEmail,
}: {
  msg: Message;
  grouped: boolean;
  onReply: (msg: Message) => void;
  onViewThread: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onHide?: (msg: Message) => void;
  currentUserEmail?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const isSupport = msg.message_type === "support";
  const isVoice = msg.message_type === "voice";
  const initial = (msg.sender_name || msg.sender_email || "?").charAt(0).toUpperCase();

  return (
    <div
      className="group relative px-4 sm:px-6 py-0.5 transition-colors"
      style={{ background: hovered ? "#151515" : "transparent" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isSupport && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "rgba(245, 158, 11, 0.04)", borderLeft: "3px solid #F59E0B" }}
        />
      )}
      <div className="flex gap-3 relative">
        {/* Avatar / spacer */}
        <div className="w-9 shrink-0 pt-0.5">
          {!grouped && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold"
              style={{
                background: msg.sender_type === "team" ? "#202020" : "var(--color-red)",
                color: "#F0EDE6",
              }}
            >
              {isSupport ? "\uD83C\uDFAB" : initial}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {!grouped && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-semibold text-[13px]" style={{ color: "#F0EDE6", fontFamily: "var(--font-heading)" }}>
                {msg.sender_name || msg.sender_email}
              </span>
              <span className="text-[11px]" style={{ color: "#5A5652" }}>{formatTime(msg.created_at)}</span>
              {isSupport && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#3D3500", color: "#F59E0B" }}>
                  SUPPORT
                </span>
              )}
            </div>
          )}
          <div className="text-[13px] leading-[1.6]" style={{ color: "#C5C0B8" }}>
            {isVoice && msg.voice_url ? (
              <VoicePlayer url={msg.voice_url} duration={msg.voice_duration} />
            ) : (
              renderContent(msg.content, msg.message_type)
            )}
          </div>

          {/* Reply count */}
          {(msg.reply_count || 0) > 0 && (
            <button
              className="flex items-center gap-1 mt-1 text-[12px] font-semibold hover:underline"
              style={{ color: "var(--color-red)", background: "none", border: "none", cursor: "pointer", padding: 0, minHeight: 28 }}
              onClick={() => onViewThread(msg)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {msg.reply_count} {msg.reply_count === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {/* Hover actions */}
        {hovered && !msg.thread_parent_id && (
          <div
            className="absolute top-0 right-4 sm:right-6 flex gap-0.5 rounded-lg shadow-lg"
            style={{ background: "#1A1A1A", border: "1px solid #252525" }}
          >
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[#252525] rounded-lg"
              style={{ color: "#A8A49C", minHeight: 32 }}
              onClick={() => onReply(msg)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
              Reply
            </button>
            {currentUserEmail && msg.sender_email === currentUserEmail && onDelete && (
              <button
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[#252525] rounded-lg"
                style={{ color: "#A8A49C", minHeight: 32 }}
                title="Delete"
                onClick={() => onDelete(msg)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            )}
            {currentUserEmail && msg.sender_email !== currentUserEmail && onHide && (
              <button
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[#252525] rounded-lg"
                style={{ color: "#A8A49C", minHeight: 32 }}
                title="Hide from my view"
                onClick={() => onHide(msg)}
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
}

/* ─── Thread Panel ─── */
function ThreadPanel({
  parentMsg,
  clientId,
  currentUser,
  teamMembers,
  clientName,
  clientEmail,
  onClose,
}: {
  parentMsg: Message;
  clientId: string;
  currentUser: CurrentUser;
  teamMembers: TeamMember[];
  clientName: string;
  clientEmail: string;
  onClose: () => void;
}) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const loadReplies = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?client_id=${clientId}&thread_parent_id=${parentMsg.id}`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [clientId, parentMsg.id]);

  useEffect(() => {
    loadReplies();
    const interval = setInterval(loadReplies, 5000);
    return () => clearInterval(interval);
  }, [loadReplies]);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  const handleDeleteReply = useCallback(async (msg: Message) => {
    const res = await fetch(`/api/messages?id=${msg.id}`, { method: "DELETE" });
    if (res.ok) setReplies((prev) => prev.filter((r) => r.id !== msg.id));
  }, []);

  const handleHideReply = useCallback(async (msg: Message) => {
    const res = await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msg.id, action: "hide" }),
    });
    if (res.ok) setReplies((prev) => prev.filter((r) => r.id !== msg.id));
  }, []);

  const sendReply = async (content: string, mentions: string[], messageType?: string) => {
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      client_id: clientId,
      sender_email: currentUser.email,
      sender_name: currentUser.name,
      sender_type: currentUser.type,
      content,
      created_at: new Date().toISOString(),
      thread_parent_id: parentMsg.id,
      message_type: (messageType as Message["message_type"]) || "text",
      mentions: mentions || [],
      voice_url: null,
      voice_duration: null,
    };
    setReplies((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          sender_email: currentUser.email,
          sender_name: currentUser.name,
          sender_type: currentUser.type,
          content,
          thread_parent_id: parentMsg.id,
          message_type: messageType || "text",
          mentions,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setReplies((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      }
    } catch {
      setReplies((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#0A0A0A" }}>
      {/* Thread header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid #1A1A1A" }}>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8A49C" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-heading font-bold text-[14px]" style={{ color: "#F0EDE6" }}>Thread</span>
          <span className="text-[11px]" style={{ color: "#5A5652" }}>{replies.length} {replies.length === 1 ? "reply" : "replies"}</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg transition-colors hover:bg-[#1A1A1A]"
          style={{ width: 36, height: 36, color: "#A8A49C" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Parent message + replies */}
      <div className="flex-1 overflow-y-auto">
        {/* Parent message */}
        <div className="px-4 sm:px-6 py-3" style={{ borderBottom: "1px solid #1A1A1A" }}>
          <div className="flex gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0"
              style={{
                background: parentMsg.sender_type === "team" ? "#202020" : "var(--color-red)",
                color: "#F0EDE6",
              }}
            >
              {(parentMsg.sender_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-semibold text-[13px]" style={{ color: "#F0EDE6", fontFamily: "var(--font-heading)" }}>
                  {parentMsg.sender_name || parentMsg.sender_email}
                </span>
                <span className="text-[11px]" style={{ color: "#5A5652" }}>{formatTime(parentMsg.created_at)}</span>
              </div>
              <div className="text-[13px] leading-[1.6]" style={{ color: "#C5C0B8" }}>
                {renderContent(parentMsg.content, parentMsg.message_type)}
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        {loading ? (
          <div className="text-center py-8 text-[12px]" style={{ color: "#5A5652" }}>Loading replies...</div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8 text-[12px]" style={{ color: "#5A5652" }}>No replies yet. Start the conversation.</div>
        ) : (
          replies.map((r, i) => {
            const grouped = shouldGroup(r, i > 0 ? replies[i - 1] : undefined);
            return (
              <MessageRow
                key={r.id}
                msg={r}
                grouped={grouped}
                onReply={() => {}}
                onViewThread={() => {}}
                onDelete={handleDeleteReply}
                onHide={handleHideReply}
                currentUserEmail={currentUser.email}
              />
            );
          })
        )}
        <div ref={repliesEndRef} />
      </div>

      {/* Thread input */}
      <MessageInput
        onSend={sendReply}
        onSendVoice={(base64, dur) => sendReply("[Voice Message]", [], "voice")}
        teamMembers={teamMembers}
        clientName={clientName}
        clientEmail={clientEmail}
        placeholder="Reply in thread..."
      />
    </div>
  );
}

/* ─── Main Component ─── */
export function MessageThread({ clientId, currentUser, clientName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [threadMsg, setThreadMsg] = useState<Message | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resolvedClientName = clientName || "Client";
  // For clientEmail we need it for @mentions. If currentUser is client type, use their email.
  // Otherwise it's empty (team user viewing a client's channel).
  const clientEmail = currentUser.type === "client" ? currentUser.email : "";

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
    } catch {
      setError("Failed to load messages.");
    }
    setLoading(false);
  }, [clientId]);

  const handleDeleteMessage = useCallback(async (msg: Message) => {
    try {
      const res = await fetch(`/api/messages?id=${msg.id}`, { method: "DELETE" });
      if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch {
      setError("Failed to delete message.");
    }
  }, []);

  const handleHideMessage = useCallback(async (msg: Message) => {
    try {
      const res = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id, action: "hide" }),
      });
      if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch {}
  }, []);

  const loadTeamMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/team-members");
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadMessages();
    loadTeamMembers();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages, loadTeamMembers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (content: string, mentions: string[], messageType?: string, voiceUrl?: string, voiceDuration?: number) => {
    const type = messageType || "text";
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      client_id: clientId,
      sender_email: currentUser.email,
      sender_name: currentUser.name,
      sender_type: currentUser.type,
      content,
      created_at: new Date().toISOString(),
      thread_parent_id: null,
      message_type: type as Message["message_type"],
      mentions: mentions || [],
      voice_url: voiceUrl || null,
      voice_duration: voiceDuration || null,
      reply_count: 0,
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
          content,
          message_type: type,
          mentions,
          voice_url: voiceUrl || null,
          voice_duration: voiceDuration || null,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? { ...saved, reply_count: 0 } : m)));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setError("Failed to send message. Please try again.");
    }
  };

  const handleSend = (content: string, mentions: string[], messageType?: string) => {
    sendMessage(content, mentions, messageType);
  };

  const openThread = (msg: Message) => {
    setThreadMsg(msg);
  };

  return (
    <div className="flex h-full" style={{ background: "#0A0A0A" }}>
      {/* Main channel */}
      <div className={`flex flex-col flex-1 min-w-0 ${threadMsg ? "hidden sm:flex" : "flex"}`}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 shrink-0 flex items-center gap-3" style={{ borderBottom: "1px solid #1A1A1A" }}>
          <span className="font-heading font-bold text-[15px]" style={{ color: "#F0EDE6" }}>{resolvedClientName}</span>
          <div className="flex-1" />
          <span className="text-[11px]" style={{ color: "#5A5652" }}>{messages.length} messages</span>
        </div>

        {/* Messages feed */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="text-center py-10 text-[13px]" style={{ color: "#5A5652" }}>Loading messages...</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center py-16" style={{ color: "#5A5652" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-30">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div className="text-[13px] mb-1">No messages yet</div>
              <div className="text-[11px]">Start the conversation with {resolvedClientName}</div>
            </div>
          )}
          {messages.map((msg, i) => {
            const prevMsg = i > 0 ? messages[i - 1] : undefined;
            const dateSep = getDateSeparator(msg.created_at, prevMsg?.created_at);
            const grouped = !dateSep && shouldGroup(msg, prevMsg);

            return (
              <div key={msg.id}>
                {dateSep && (
                  <div className="flex items-center gap-3 mx-4 sm:mx-6 my-4">
                    <div className="flex-1 h-px" style={{ background: "#1A1A1A" }} />
                    <span className="text-[10px] font-bold tracking-[0.08em] uppercase shrink-0" style={{ color: "#5A5652" }}>{dateSep}</span>
                    <div className="flex-1 h-px" style={{ background: "#1A1A1A" }} />
                  </div>
                )}
                <MessageRow
                  msg={msg}
                  grouped={grouped}
                  onReply={openThread}
                  onViewThread={openThread}
                  onDelete={handleDeleteMessage}
                  onHide={handleHideMessage}
                  currentUserEmail={currentUser.email}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 sm:px-6 py-2 shrink-0">
            <p className="text-[12px] m-0" style={{ color: "#EF4444" }}>{error}</p>
          </div>
        )}

        {/* Input */}
        <MessageInput
          onSend={handleSend}
          onSendVoice={(base64, dur) => sendMessage("[Voice Message]", [], "voice", base64, dur)}
          teamMembers={teamMembers}
          clientName={resolvedClientName}
          clientEmail={clientEmail}
        />
      </div>

      {/* Thread panel */}
      {threadMsg && (
        <>
          {/* Mobile: full-screen overlay */}
          <div className="fixed inset-0 z-50 sm:hidden" style={{ background: "#0A0A0A" }}>
            <ThreadPanel
              parentMsg={threadMsg}
              clientId={clientId}
              currentUser={currentUser}
              teamMembers={teamMembers}
              clientName={resolvedClientName}
              clientEmail={clientEmail}
              onClose={() => setThreadMsg(null)}
            />
          </div>
          {/* Desktop: side panel */}
          <div className="hidden sm:flex w-[380px] shrink-0 border-l" style={{ borderColor: "#1A1A1A" }}>
            <ThreadPanel
              parentMsg={threadMsg}
              clientId={clientId}
              currentUser={currentUser}
              teamMembers={teamMembers}
              clientName={resolvedClientName}
              clientEmail={clientEmail}
              onClose={() => setThreadMsg(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}
