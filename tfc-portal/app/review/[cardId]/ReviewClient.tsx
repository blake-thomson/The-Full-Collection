"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";

interface CardData {
  id: string;
  title: string;
  description?: string;
  column_id: string;
  platform?: string;
  content_type?: string;
  client_id: string;
  approval_status?: string;
}

interface Attachment {
  id: string;
  drive_file_id: string;
  drive_file_name: string;
  drive_mime_type: string;
  drive_view_link: string;
  is_final: boolean;
}

interface Comment {
  id: string;
  card_id: string;
  author_email: string;
  author_name: string;
  author_type: "client" | "team";
  content: string;
  created_at: string;
  timestamp_seconds?: number | null;
  resolved?: boolean;
}

interface ClientInfo {
  id: string;
  name: string;
  email: string;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getInitialColor(name: string): string {
  const colors = [
    "#E02020", "#3B82F6", "#10B981", "#F59E0B",
    "#8B5CF6", "#EC4899", "#06B6D4", "#EF4444",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
  linkedin: "LinkedIn", twitter: "Twitter", facebook: "Facebook",
  podcast: "Podcast", blog: "Blog",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  short_form: "Short Form", long_form: "Long Form", carousel: "Carousel",
  story: "Story", live: "Live", podcast: "Podcast", blog: "Blog",
};

export default function ReviewClient() {
  const { cardId } = useParams<{ cardId: string }>();
  const router = useRouter();
  const supabase = createBrowserSupabase();

  const [card, setCard] = useState<CardData | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [approving, setApproving] = useState(false);
  const [requestingRevisions, setRequestingRevisions] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadComments = useCallback(async () => {
    if (!cardId) return;
    try {
      const res = await fetch(`/api/cards/${cardId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch { /* silent */ }
  }, [cardId]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const clientRes = await fetch(`/api/clients?email=${user.email}`);
        if (!clientRes.ok) { setError("Unable to verify your account."); setLoading(false); return; }
        const clients = await clientRes.json();
        if (!clients.length) { setError("No client account found."); setLoading(false); return; }
        const clientData = clients[0];
        setClient(clientData);

        const cardRes = await fetch(`/api/kanban?client_id=${clientData.id}`);
        if (!cardRes.ok) { setError("Unable to load content."); setLoading(false); return; }
        const cards = await cardRes.json();
        const thisCard = cards.find((c: CardData) => c.id === cardId);
        if (!thisCard) { setError("Content not found."); setLoading(false); return; }
        setCard(thisCard);

        // Fetch attachments, pick first final video
        const attachRes = await fetch(`/api/cards/${cardId}/attachments`);
        if (attachRes.ok) {
          const attachments: Attachment[] = await attachRes.json();
          const finalVideo = attachments.find((a) => a.is_final && (a.drive_mime_type?.startsWith("video/") || a.drive_mime_type === "application/mp4"));
          const finalAny = attachments.find((a) => a.is_final);
          setAttachment(finalVideo || finalAny || null);
        }

        await loadComments();
      } catch { setError("Something went wrong. Please try again."); }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    pollRef.current = setInterval(loadComments, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadComments]);

  const addComment = async () => {
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch { /* silent */ }
    setSubmittingComment(false);
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/approve`, { method: "POST" });
      if (res.ok) {
        setSuccessMessage("Content approved! Redirecting...");
        setShowApproveConfirm(false);
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to approve.");
        setApproving(false);
      }
    } catch { setError("Network error. Please try again."); setApproving(false); }
  };

  const handleRequestRevisions = async () => {
    if (revisionNotes.trim().length < 10) return;
    setRequestingRevisions(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/request-revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: revisionNotes.trim() }),
      });
      if (res.ok) {
        setSuccessMessage("Revision request sent! Redirecting...");
        setShowRevisionForm(false);
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to request revisions.");
        setRequestingRevisions(false);
      }
    } catch { setError("Network error. Please try again."); setRequestingRevisions(false); }
  };

  const isVideo = attachment?.drive_mime_type?.startsWith("video/") || attachment?.drive_mime_type === "application/mp4";

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-6 h-6 border-2 border-red/30 border-t-red rounded-full animate-spin" />
          <span className="text-text-3 text-sm">Loading review...</span>
        </div>
      </div>
    );
  }

  if (error && !card) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#EF4444] text-sm mb-4">{error}</p>
          <button onClick={() => router.push("/dashboard")} className="text-red text-sm underline cursor-pointer bg-transparent border-none font-body">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-[#10B981]/15 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-text text-lg font-heading font-bold mb-1">{successMessage}</p>
          <p className="text-text-3 text-sm">Taking you back to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!card || !client) return null;

  const alreadyApproved = card.approval_status === "approved";

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer transition-colors p-1" title="Back to dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="font-heading font-[800] tracking-[0.28em] uppercase text-red" style={{ fontSize: 12 }}>
            THE FULL COLLECTION
          </span>
        </div>
        <span className="text-text-2 text-xs font-medium">{client.name}</span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Media */}
        <div className="lg:w-[60%] flex flex-col overflow-y-auto border-b lg:border-b-0 lg:border-r border-border">
          <div className="p-4 sm:p-6 flex-1">
            {isVideo && attachment ? (
              <div className="rounded-xl overflow-hidden border border-border bg-black mb-4">
                <iframe
                  src={`https://drive.google.com/file/d/${attachment.drive_file_id}/preview`}
                  className="w-full aspect-video"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>
            ) : attachment ? (
              <div className="rounded-xl border border-border bg-surface-2 p-6 mb-4 text-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-3 mx-auto mb-3">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <p className="text-text-2 text-sm mb-3">{attachment.drive_file_name}</p>
                <a href={attachment.drive_view_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-red text-sm font-semibold hover:underline">
                  Open in Google Drive
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface-2 p-6 mb-4 text-center">
                <p className="text-text-3 text-sm">No files attached yet. Check back soon.</p>
              </div>
            )}

            <h1 className="text-text font-heading text-xl font-bold mb-2">{card.title}</h1>
            {card.description && (
              <p className="text-text-2 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{card.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mb-6">
              {card.platform && (
                <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-1 px-2.5 rounded-md bg-red/10 border border-red/20 text-red">
                  {PLATFORM_LABELS[card.platform] || card.platform}
                </span>
              )}
              {card.content_type && (
                <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-1 px-2.5 rounded-md bg-surface-3 border border-border text-text-2">
                  {CONTENT_TYPE_LABELS[card.content_type] || card.content_type}
                </span>
              )}
              {alreadyApproved && (
                <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-1 px-2.5 rounded-md bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]">
                  Approved
                </span>
              )}
            </div>

            {error && <p className="text-[#EF4444] text-xs mb-4">{error}</p>}

            {!alreadyApproved && (
              <div className="space-y-3">
                {!showApproveConfirm && !showRevisionForm && (
                  <>
                    <button
                      onClick={() => setShowApproveConfirm(true)}
                      className="w-full py-3 px-6 rounded-xl text-sm font-semibold cursor-pointer transition-all border-none font-body"
                      style={{ background: "#10B981", color: "#fff" }}
                    >
                      Approve Content
                    </button>
                    <button
                      onClick={() => setShowRevisionForm(true)}
                      className="w-full py-3 px-6 rounded-xl text-sm font-semibold cursor-pointer transition-all border font-body"
                      style={{ background: "transparent", color: "#A8A49C", borderColor: "#252525" }}
                    >
                      Request Revisions
                    </button>
                  </>
                )}

                {showApproveConfirm && (
                  <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-4">
                    <p className="text-text text-sm font-semibold mb-1">Confirm approval?</p>
                    <p className="text-text-3 text-xs mb-4">This will mark the content as approved and notify the team.</p>
                    <div className="flex gap-2">
                      <button onClick={handleApprove} disabled={approving} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold cursor-pointer border-none font-body disabled:opacity-50" style={{ background: "#10B981", color: "#fff" }}>
                        {approving ? "Approving..." : "Yes, Approve"}
                      </button>
                      <button onClick={() => setShowApproveConfirm(false)} className="py-2.5 px-4 rounded-lg text-sm font-semibold cursor-pointer border border-border bg-transparent text-text-2 font-body">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {showRevisionForm && (
                  <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 p-4">
                    <p className="text-text text-sm font-semibold mb-1">What changes are needed?</p>
                    <p className="text-text-3 text-xs mb-3">Be specific so the team knows exactly what to fix (min 10 characters).</p>
                    <textarea
                      className="w-full bg-surface border border-border rounded-lg p-3 text-text text-sm resize-none outline-none focus:border-border-2 font-body"
                      rows={4}
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="e.g. Please shorten the intro, change the music, add captions to the first 10 seconds..."
                    />
                    <div className="flex gap-2 mt-3">
                      <button onClick={handleRequestRevisions} disabled={requestingRevisions || revisionNotes.trim().length < 10} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold cursor-pointer border-none font-body disabled:opacity-50" style={{ background: "#EF4444", color: "#fff" }}>
                        {requestingRevisions ? "Sending..." : "Send Revision Request"}
                      </button>
                      <button onClick={() => { setShowRevisionForm(false); setRevisionNotes(""); }} className="py-2.5 px-4 rounded-lg text-sm font-semibold cursor-pointer border border-border bg-transparent text-text-2 font-body">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Comments */}
        <div className="lg:w-[40%] flex flex-col bg-surface min-h-0">
          <div className="px-4 sm:px-5 py-3 border-b border-border shrink-0">
            <h2 className="text-text text-sm font-heading font-bold m-0">Comments</h2>
            <p className="text-text-3 text-[11px] m-0 mt-0.5">{comments.length} comment{comments.length !== 1 ? "s" : ""}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {comments.length === 0 && (
              <p className="text-text-3 text-sm text-center py-8">No comments yet. Start the conversation below.</p>
            )}
            {comments.map((c) => {
              const initial = (c.author_name || c.author_email)[0].toUpperCase();
              const color = getInitialColor(c.author_name || c.author_email);
              const isResolved = c.resolved === true;
              return (
                <div key={c.id} className={`flex gap-3 ${isResolved ? "opacity-50" : ""}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white" style={{ background: color }}>
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs font-semibold ${isResolved ? "line-through text-text-3" : "text-text"}`}>
                        {c.author_name || c.author_email}
                      </span>
                      {c.timestamp_seconds != null && (
                        <span className="text-[10px] font-mono py-0.5 px-1.5 rounded bg-red/10 border border-red/20 text-red">
                          {formatTimestamp(c.timestamp_seconds)}
                        </span>
                      )}
                      <span className="text-text-3 text-[10px] ml-auto shrink-0">
                        {new Date(c.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed m-0 ${isResolved ? "line-through text-text-3" : "text-text-2"}`}>
                      {c.content}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={commentsEndRef} />
          </div>

          <div className="p-4 sm:p-5 border-t border-border shrink-0">
            <div className="flex gap-2">
              <textarea
                className="flex-1 bg-surface-2 border border-border rounded-lg p-3 text-text text-xs resize-none outline-none focus:border-border-2 font-body"
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }}
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim() || submittingComment}
                className="self-end py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer border-none font-body disabled:opacity-40 transition-colors bg-red text-white"
              >
                {submittingComment ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
