"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";

/* ── Role metadata ── */
const ROLE_COLORS: Record<string, string> = {
  owner: "#F59E0B",
  admin: "#FF3B3B",
  project_manager: "#3B82F6",
  editor: "#10B981",
  smm: "#8B5CF6",
  social_media_manager: "#8B5CF6",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  project_manager: "Project Manager",
  editor: "Editor",
  smm: "Social Media Manager",
  social_media_manager: "Social Media Manager",
};

const ROLE_EMOJIS: Record<string, string> = {
  owner: "👑",
  admin: "🛡️",
  project_manager: "📋",
  editor: "🎬",
  smm: "📱",
  social_media_manager: "📱",
};

const ROLE_WELCOME_LINES: Record<string, string> = {
  owner: "You're running the show. Let's set up your profile so the team knows who's boss.",
  admin: "You keep everything running smooth. Let's get your profile set up.",
  project_manager: "You keep the pipeline moving. Let's get your profile set up so the team knows who's keeping them on track.",
  editor: "The magic happens in the edit bay. Let's get your profile looking as good as your cuts.",
  smm: "You're the voice of the brand. Let's make sure your profile matches the energy.",
  social_media_manager: "You're the voice of the brand. Let's make sure your profile matches the energy.",
};

/* ── Confetti particles ── */
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#E02020", "#F59E0B", "#10B981", "#8B5CF6", "#3B82F6", "#EC4899", "#F0EDE6"];
    const particles: { x: number; y: number; w: number; h: number; color: string; vx: number; vy: number; rotation: number; rotSpeed: number; opacity: number }[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        opacity: 1,
      });
    }

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.vy += 0.04;
        if (p.y > canvas.height) p.opacity -= 0.02;
        if (p.opacity <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}
    />
  );
}

/* ── Step indicator dots ── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i === current ? "#E02020" : i < current ? "#E02020" : "#252525",
            opacity: i < current ? 0.5 : 1,
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

export default function WelcomeClient() {
  const [step, setStep] = useState(0);
  const [member, setMember] = useState<{
    id: string; name: string; email: string; role: string;
    bio?: string; avatar_url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  // Load current team member
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/team/login"); return; }

      const res = await fetch("/api/team-members");
      if (!res.ok) { router.push("/team/login"); return; }
      const members = await res.json();
      const me = members.find((m: { email: string }) => m.email === user.email);
      if (!me) { router.push("/team/login"); return; }

      setMember(me);
      setBio(me.bio || "");
      if (me.avatar_url) setAvatarPreview(me.avatar_url);
      setLoading(false);
      // Trigger entrance animation
      setTimeout(() => setFadeIn(true), 50);
    })();
  }, [supabase, router]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarPreview; // Already has a URL
    setUploading(true);
    const formData = new FormData();
    formData.append("file", avatarFile);
    const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) return null;
    const data = await res.json();
    return data.avatar_url;
  };

  const saveBio = async () => {
    setSaving(true);
    await fetch("/api/team-members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio }),
    });
    setSaving(false);
  };

  const handleNext = async () => {
    if (step === 1 && avatarFile) {
      await uploadAvatar();
    }
    if (step === 2 && bio.trim()) {
      await saveBio();
    }
    setFadeIn(false);
    setTimeout(() => {
      setStep((s) => s + 1);
      setTimeout(() => setFadeIn(true), 50);
    }, 200);
  };

  const handleSkip = () => {
    setFadeIn(false);
    setTimeout(() => {
      setStep((s) => s + 1);
      setTimeout(() => setFadeIn(true), 50);
    }, 200);
  };

  const goToPortal = () => {
    router.push("/team/portal");
  };

  if (loading) {
    return (
      <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#5A5652", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!member) return null;

  const roleColor = ROLE_COLORS[member.role] ?? "#A8A49C";
  const roleLabel = ROLE_LABELS[member.role] ?? member.role;
  const roleEmoji = ROLE_EMOJIS[member.role] ?? "🚀";
  const welcomeLine = ROLE_WELCOME_LINES[member.role] ?? "Let's get your profile set up.";

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      {/* Background glow */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${roleColor}08 0%, transparent 60%)`,
        }}
      />

      {step === 3 && <Confetti />}

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          position: "relative",
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.4s ease",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Logo size={15} sub="Team Portal" />
        </div>

        <StepDots current={step} total={4} />

        {/* ═══ STEP 0: Welcome Splash ═══ */}
        {step === 0 && (
          <div style={{
            background: "#111111", border: "1px solid #1e1e1e", borderRadius: 20,
            padding: "40px 28px", textAlign: "center",
          }}>
            <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>{roleEmoji}</div>
            <h1 style={{
              color: "#F0EDE6", fontSize: 26, fontWeight: 800, margin: "0 0 8px",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Welcome, {member.name.split(" ")[0]}!
            </h1>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px", borderRadius: 20, marginBottom: 20,
              background: `${roleColor}15`, border: `1px solid ${roleColor}30`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: roleColor }} />
              <span style={{ color: roleColor, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {roleLabel}
              </span>
            </div>
            <p style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.7, margin: "0 0 32px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
              {welcomeLine}
            </p>
            <button className="tfc-btn" style={{ width: "100%", fontSize: 14 }} onClick={handleNext}>
              Let&apos;s Go →
            </button>
          </div>
        )}

        {/* ═══ STEP 1: Profile Picture ═══ */}
        {step === 1 && (
          <div style={{
            background: "#111111", border: "1px solid #1e1e1e", borderRadius: 20,
            padding: "36px 28px", textAlign: "center",
          }}>
            <h2 style={{ color: "#F0EDE6", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
              Show your face 📸
            </h2>
            <p style={{ color: "#5A5652", fontSize: 13, margin: "0 0 28px" }}>
              Upload a profile picture so the team knows who you are
            </p>

            {/* Upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              style={{
                width: 160, height: 160, borderRadius: "50%", margin: "0 auto 24px",
                border: dragActive ? `3px dashed ${roleColor}` : avatarPreview ? `3px solid ${roleColor}44` : "3px dashed #333",
                background: avatarPreview ? "transparent" : dragActive ? `${roleColor}08` : "#0D0D0D",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", overflow: "hidden", transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div style={{ color: "#5A5652", fontSize: 11, marginTop: 8, lineHeight: 1.4 }}>
                    Tap to upload<br />or drag & drop
                  </div>
                </div>
              )}
              {avatarPreview && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0, transition: "opacity 0.2s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Change</span>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {avatarPreview && (
              <p style={{ color: "#10B981", fontSize: 12, margin: "0 0 20px" }}>
                Looking good! 🔥
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="tfc-btn-ghost"
                style={{ flex: 1, fontSize: 13 }}
                onClick={handleSkip}
              >
                Skip for now
              </button>
              <button
                className="tfc-btn"
                style={{ flex: 1, fontSize: 13 }}
                onClick={handleNext}
                disabled={uploading || !avatarPreview}
              >
                {uploading ? "Uploading..." : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Bio ═══ */}
        {step === 2 && (
          <div style={{
            background: "#111111", border: "1px solid #1e1e1e", borderRadius: 20,
            padding: "36px 28px",
          }}>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ color: "#F0EDE6", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
                Tell us about you ✍️
              </h2>
              <p style={{ color: "#5A5652", fontSize: 13, margin: "0 0 28px" }}>
                A short bio so the team and clients can get to know you
              </p>
            </div>

            {/* Avatar + name preview */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14, marginBottom: 20,
              padding: "14px 18px", background: "#0D0D0D", borderRadius: 12, border: "1px solid #1A1A1A",
            }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={member.name}
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${roleColor}33`, flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${roleColor}33, ${roleColor}11)`,
                  border: `2px solid ${roleColor}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, color: roleColor, flexShrink: 0,
                }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ color: "#F0EDE6", fontSize: 14, fontWeight: 600 }}>{member.name}</div>
                <div style={{ color: roleColor, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{roleLabel}</div>
              </div>
            </div>

            <label style={{ color: "#5A5652", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Your Bio
            </label>
            <textarea
              className="tfc-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="E.g. Video editor specializing in short-form content. 5 years of experience making brands pop on social media..."
              rows={4}
              style={{ marginBottom: 6 }}
            />
            <div style={{ color: "#3A3632", fontSize: 11, marginBottom: 24, textAlign: "right" }}>
              {bio.length} / 500
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="tfc-btn-ghost"
                style={{ flex: 1, fontSize: 13 }}
                onClick={handleSkip}
              >
                Skip for now
              </button>
              <button
                className="tfc-btn"
                style={{ flex: 1, fontSize: 13 }}
                onClick={handleNext}
                disabled={saving || !bio.trim()}
              >
                {saving ? "Saving..." : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Done / Celebration ═══ */}
        {step === 3 && (
          <div style={{
            background: "#111111", border: "1px solid #1e1e1e", borderRadius: 20,
            padding: "40px 28px", textAlign: "center",
          }}>
            <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>🎉</div>
            <h2 style={{ color: "#F0EDE6", fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>
              You&apos;re all set!
            </h2>
            <p style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.7, margin: "0 0 28px", maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
              Your profile is ready. Welcome to The Full Collection team.
            </p>

            {/* Profile preview card */}
            <div style={{
              background: "#0D0D0D", border: "1px solid #1A1A1A", borderRadius: 14,
              padding: "20px", marginBottom: 28, textAlign: "left",
              display: "flex", alignItems: "flex-start", gap: 16,
            }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={member.name}
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${roleColor}33`, flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${roleColor}33, ${roleColor}11)`,
                  border: `2px solid ${roleColor}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, color: roleColor, flexShrink: 0,
                }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#F0EDE6", fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{member.name}</div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "2px 10px", borderRadius: 20, marginBottom: 8,
                  background: `${roleColor}15`, border: `1px solid ${roleColor}30`,
                }}>
                  <span style={{ color: roleColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {roleLabel}
                  </span>
                </div>
                {bio && (
                  <p style={{ color: "#A8A49C", fontSize: 12, lineHeight: 1.6, margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {bio}
                  </p>
                )}
              </div>
            </div>

            <button className="tfc-btn" style={{ width: "100%", fontSize: 14 }} onClick={goToPortal}>
              Enter the Portal 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
