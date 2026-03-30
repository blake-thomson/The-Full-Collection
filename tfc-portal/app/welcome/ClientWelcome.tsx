"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { Confetti } from "@/components/ui/Confetti";
import { StepDots } from "@/components/ui/StepDots";
import { INDUSTRIES } from "@/lib/constants";

export default function ClientWelcome() {
  const [step, setStep] = useState(0);
  const [client, setClient] = useState<{
    id: string; name: string; email: string;
    bio?: string; avatar_url?: string; industry?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  const brandColor = "var(--color-red)";

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const res = await fetch(`/api/clients?email=${user.email}`);
      if (!res.ok) { router.push("/login"); return; }
      const clients = await res.json();
      if (clients.length === 0) { router.push("/login"); return; }

      const me = clients[0];
      if (me.profile_complete) { router.push("/dashboard"); return; }

      setClient(me);
      setBio(me.bio || "");
      setIndustry(me.industry || "");
      if (me.avatar_url) setAvatarPreview(me.avatar_url);
      setLoading(false);
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
    if (!avatarFile) return avatarPreview;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", avatarFile);
    const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) return null;
    const data = await res.json();
    return data.avatar_url;
  };

  const saveProfile = async () => {
    setSaving(true);
    const finalIndustry = industry === "Other" ? customIndustry.trim() : industry;
    await fetch("/api/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, industry: finalIndustry }),
    });
    setSaving(false);
  };

  const handleNext = async () => {
    if (step === 1 && avatarFile) {
      await uploadAvatar();
    }
    if (step === 2) {
      await saveProfile();
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

  const goToDashboard = async () => {
    await fetch("/api/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_complete: true }),
    });
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#5A5652", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      {/* Background glow */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${brandColor}08 0%, transparent 60%)`,
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
          <Logo size={15} sub="Client Portal" />
        </div>

        <StepDots current={step} total={4} />

        {/* ═══ STEP 0: Welcome Splash ═══ */}
        {step === 0 && (
          <div style={{
            background: "#111111", border: "1px solid #1e1e1e", borderRadius: 20,
            padding: "40px 28px", textAlign: "center",
          }}>
            <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>🎬</div>
            <h1 style={{
              color: "#F0EDE6", fontSize: 26, fontWeight: 800, margin: "0 0 8px",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Welcome, {client.name.split(" ")[0]}!
            </h1>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px", borderRadius: 20, marginBottom: 20,
              background: `${brandColor}15`, border: `1px solid ${brandColor}30`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: brandColor }} />
              <span style={{ color: brandColor, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Client
              </span>
            </div>
            <p style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.7, margin: "0 0 32px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
              Before we start creating amazing content, let&apos;s set up your profile so our team knows exactly who they&apos;re working with.
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
              Put a face to the name 📸
            </h2>
            <p style={{ color: "#5A5652", fontSize: 13, margin: "0 0 28px" }}>
              Upload a profile picture so our team can recognize you
            </p>

            {/* Upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              style={{
                width: 160, height: 160, borderRadius: "50%", margin: "0 auto 24px",
                border: dragActive ? `3px dashed ${brandColor}` : avatarPreview ? `3px solid ${brandColor}44` : "3px dashed #333",
                background: avatarPreview ? "transparent" : dragActive ? `${brandColor}08` : "#0D0D0D",
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

        {/* ═══ STEP 2: Bio + Industry ═══ */}
        {step === 2 && (
          <div style={{
            background: "#111111", border: "1px solid #1e1e1e", borderRadius: 20,
            padding: "36px 28px",
          }}>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ color: "#F0EDE6", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
                Tell us about your brand ✍️
              </h2>
              <p style={{ color: "#5A5652", fontSize: 13, margin: "0 0 28px" }}>
                Help our team understand you and your business
              </p>
            </div>

            {/* Avatar + name preview */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
              padding: "14px 18px", background: "#0D0D0D", borderRadius: 12, border: "1px solid #1A1A1A",
            }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={client.name}
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${brandColor}33`, flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${brandColor}33, ${brandColor}11)`,
                  border: `2px solid ${brandColor}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, color: brandColor, flexShrink: 0,
                }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ color: "#F0EDE6", fontSize: 14, fontWeight: 600 }}>{client.name}</div>
                <div style={{ color: brandColor, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Client</div>
              </div>
            </div>

            {/* Industry */}
            <label style={{ color: "#5A5652", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Your Industry
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 8,
              marginBottom: industry === "Other" ? 8 : 24,
            }}>
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setIndustry(ind)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: industry === ind ? `2px solid ${brandColor}` : "1px solid #252525",
                    background: industry === ind ? `${brandColor}12` : "#0D0D0D",
                    color: industry === ind ? "#F0EDE6" : "#A8A49C",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {ind}
                </button>
              ))}
            </div>

            {industry === "Other" && (
              <div style={{ marginBottom: 24 }}>
                <input
                  className="tfc-input"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="What industry are you in?"
                />
              </div>
            )}

            {/* Bio */}
            <label style={{ color: "#5A5652", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              About You / Your Brand
            </label>
            <textarea
              className="tfc-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="E.g. We're a luxury real estate team in Miami focused on waterfront properties. We want content that feels premium but approachable..."
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
                disabled={saving || (!industry && !bio.trim())}
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
              Your profile is ready. Let&apos;s start creating some amazing content together.
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
                  alt={client.name}
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${brandColor}33`, flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${brandColor}33, ${brandColor}11)`,
                  border: `2px solid ${brandColor}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, color: brandColor, flexShrink: 0,
                }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#F0EDE6", fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{client.name}</div>
                {(industry || customIndustry) && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "2px 10px", borderRadius: 20, marginBottom: 8,
                    background: `${brandColor}15`, border: `1px solid ${brandColor}30`,
                  }}>
                    <span style={{ color: brandColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {industry === "Other" ? customIndustry : industry}
                    </span>
                  </div>
                )}
                {bio && (
                  <p style={{ color: "#A8A49C", fontSize: 12, lineHeight: 1.6, margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {bio}
                  </p>
                )}
              </div>
            </div>

            <button className="tfc-btn" style={{ width: "100%", fontSize: 14 }} onClick={goToDashboard}>
              Enter Your Portal 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
