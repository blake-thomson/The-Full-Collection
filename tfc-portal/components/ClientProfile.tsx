"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Avatar } from "@/components/ui/Avatar";
import { SubscriptionSection } from "@/components/SubscriptionSection";
import { IntakeView } from "@/components/IntakeView";
import { useTheme } from "@/lib/theme";
import { INDUSTRIES } from "@/lib/constants";
import type { Client } from "@/lib/types";
import type { OnboardingData } from "@/lib/constants";

interface ClientProfileProps {
  client: Client;
  onClientUpdate: (updated: Partial<Client>) => void;
  onLogout: () => void;
}

export function ClientProfile({ client, onClientUpdate, onLogout }: ClientProfileProps) {
  const { theme, setTheme } = useTheme();
  const supabase = createBrowserSupabase();

  const [profileTab, setProfileTab] = useState<"account" | "billing" | "intake">("account");
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordErr, setPasswordErr] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveErr, setProfileSaveErr] = useState("");

  const handleChangePassword = async () => {
    setPasswordMsg("");
    setPasswordErr("");
    if (!newPassword || newPassword.length < 6) { setPasswordErr("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordErr("Passwords do not match."); return; }
    setPasswordBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordErr(error.message); } else {
      setPasswordMsg("Password updated successfully.");
      setNewPassword(""); setConfirmPassword(""); setChangingPassword(false);
    }
    setPasswordBusy(false);
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    const form = new FormData();
    form.append("file", file);
    form.append("userId", client.id);
    const res = await fetch("/api/upload-avatar", { method: "POST", body: form });
    if (res.ok) {
      const { url } = await res.json();
      onClientUpdate({ avatar_url: url });
    }
    setUploadingAvatar(false);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileSaveErr("");
    const res = await fetch("/api/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: editBio, industry: editIndustry }),
    });
    if (res.ok) {
      const updated = await res.json();
      onClientUpdate(updated);
      setEditingProfile(false);
    } else {
      const d = await res.json();
      setProfileSaveErr(d.error || "Failed to save");
    }
    setSavingProfile(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[600px] mx-auto">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={client.name} size={52} src={client.avatar_url} />
        <div>
          <h2 className="text-text font-heading text-[20px] font-[800] m-0">{client.name}</h2>
          <p className="text-text-2 text-[13px] m-0 mt-0.5">{client.email}</p>
          {client.industry && (
            <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-[2px] px-[8px] rounded-full inline-block mt-1 bg-red/10 text-red border border-red/20">
              {client.industry}
            </span>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 border-b border-border pb-0">
        {([
          { id: "account" as const, label: "Account" },
          { id: "billing" as const, label: "Billing" },
          { id: "intake" as const, label: "My Intake" },
        ]).map((st) => (
          <button
            key={st.id}
            onClick={() => setProfileTab(st.id)}
            className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer transition-all border-none bg-transparent font-body -mb-px border-b-2 ${
              profileTab === st.id
                ? "text-text border-red"
                : "text-text-3 hover:text-text-2 border-transparent"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Account sub-tab */}
      {profileTab === "account" && (
        <div>
          {/* Profile card */}
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-7 mb-4">
            <div className="flex items-start gap-5 mb-5">
              {/* Avatar with upload */}
              <label className="relative cursor-pointer shrink-0 group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }}
                />
                {client.avatar_url ? (
                  <img
                    src={client.avatar_url}
                    alt={client.name}
                    className="w-[68px] h-[68px] rounded-full object-cover border-2 border-red/30"
                  />
                ) : (
                  <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-[26px] font-[800] text-red border-2 border-red/25"
                    style={{ background: "linear-gradient(135deg, rgba(224,32,32,0.2), rgba(224,32,32,0.06))" }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  }
                </div>
              </label>

              {/* Name + industry */}
              <div className="flex-1 min-w-0">
                <h3 className="text-text font-heading text-[18px] font-[800] m-0 mb-1">{client.name}</h3>
                <div className="text-text-3 text-[12px] mb-2">{client.email}</div>
                {client.industry && (
                  <span className="text-[11px] font-bold tracking-[0.06em] uppercase py-[3px] px-[10px] rounded-full inline-block bg-red/10 text-red border border-red/20">
                    {client.industry}
                  </span>
                )}
                {client.bio && !editingProfile && (
                  <p className="text-text-2 text-[13px] leading-[1.55] m-0 mt-2">{client.bio}</p>
                )}
              </div>

              {!editingProfile && (
                <button
                  onClick={() => { setEditingProfile(true); setEditBio(client.bio || ""); setEditIndustry(client.industry || ""); }}
                  className="shrink-0 bg-transparent border border-border hover:border-border-2 rounded-lg px-3 py-1.5 text-text-3 hover:text-text text-[12px] cursor-pointer transition-all font-body"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Inline edit form */}
            {editingProfile && (
              <div className="bg-surface-2 border border-border rounded-xl p-4 mb-4">
                <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-4">Edit Profile</h4>

                {/* Industry picker */}
                <div className="mb-4">
                  <label className="tfc-label">Industry</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => setEditIndustry(editIndustry === ind ? "" : ind)}
                        className={`text-[11px] font-medium py-2 px-3 rounded-lg border cursor-pointer transition-all font-body text-left ${
                          editIndustry === ind
                            ? "border-red/40 text-red bg-red/8"
                            : "border-border text-text-3 hover:border-border-2 hover:text-text-2 bg-surface"
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-4">
                  <label className="tfc-label">Bio</label>
                  <textarea
                    className="tfc-input mt-2"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell us a bit about yourself and your brand…"
                    rows={3}
                    style={{ resize: "vertical", minHeight: 72 }}
                  />
                </div>

                {profileSaveErr && (
                  <p className="text-[#EF4444] text-[12px] m-0 mb-3">{profileSaveErr}</p>
                )}
                <div className="flex gap-2">
                  <button className="tfc-btn flex-1" style={{ fontSize: 12, padding: "8px 16px" }} onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile ? "Saving…" : "Save Changes"}
                  </button>
                  <button className="tfc-btn-ghost flex-1" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => { setEditingProfile(false); setProfileSaveErr(""); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Member stats */}
            {[
              { l: "Member Since", v: new Date(client.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
              { l: "Onboarding", v: client.onboarding_complete ? "Complete" : "Pending", color: client.onboarding_complete ? "#10B981" : "#F59E0B" },
            ].map((row) => (
              <div key={row.l} className="flex justify-between py-2.5 border-b border-border">
                <span className="text-text-3 text-[13px]">{row.l}</span>
                <span className="text-[13px] font-semibold" style={{ color: row.color || "var(--color-text)" }}>{row.v}</span>
              </div>
            ))}
          </div>

          {/* Appearance */}
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-7 mb-4">
            <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-4">Appearance</h4>
            <div className="flex gap-3">
              {([
                { id: "dark" as const, label: "Dark", bg: "#0A0A0A", sidebar: "#111111", text: "#F0EDE6", border: "#252525" },
                { id: "light" as const, label: "Light", bg: "#F2F0EC", sidebar: "#FFFFFF", text: "#1A1917", border: "#DDD9D3" },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className="flex-1 flex flex-col items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer bg-transparent transition-all"
                  style={{ borderColor: theme === opt.id ? "var(--color-red)" : "var(--color-border-2)" }}
                >
                  <div style={{
                    width: "100%", height: 56, borderRadius: 8,
                    background: opt.bg, border: `1px solid ${opt.border}`,
                    overflow: "hidden", position: "relative", flexShrink: 0,
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 34, background: opt.sidebar, borderRight: `1px solid ${opt.border}` }} />
                    <div style={{ position: "absolute", top: 12, left: 42, right: 8, height: 7, borderRadius: 4, background: opt.text, opacity: 0.8 }} />
                    <div style={{ position: "absolute", top: 26, left: 42, right: 20, height: 5, borderRadius: 3, background: opt.text, opacity: 0.3 }} />
                    <div style={{ position: "absolute", top: 37, left: 42, right: 14, height: 5, borderRadius: 3, background: opt.text, opacity: 0.18 }} />
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-text text-[12px] font-semibold">{opt.label}</span>
                    {theme === opt.id && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-7">
            <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-4">Security</h4>
            {!changingPassword ? (
              <button className="tfc-btn-ghost w-full text-center" onClick={() => setChangingPassword(true)}>
                Change Password
              </button>
            ) : (
              <div className="bg-surface-2 border border-border rounded-xl p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="tfc-label">New Password</label>
                    <input className="tfc-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                  </div>
                  <div>
                    <label className="tfc-label">Confirm Password</label>
                    <input className="tfc-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
                  </div>
                  {passwordErr && <p className="text-[#EF4444] text-[12px] m-0">{passwordErr}</p>}
                  {passwordMsg && <p className="text-[#10B981] text-[12px] m-0">{passwordMsg}</p>}
                  <div className="flex gap-2">
                    <button className="tfc-btn flex-1" style={{ fontSize: 12, padding: "8px 16px" }} onClick={handleChangePassword} disabled={passwordBusy}>
                      {passwordBusy ? "Updating..." : "Update Password"}
                    </button>
                    <button className="tfc-btn-ghost flex-1" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => { setChangingPassword(false); setNewPassword(""); setConfirmPassword(""); setPasswordErr(""); setPasswordMsg(""); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            <button className="tfc-btn-ghost w-full text-center mt-3" onClick={onLogout}>Sign Out</button>
          </div>
        </div>
      )}

      {/* Billing sub-tab */}
      {profileTab === "billing" && (
        <SubscriptionSection clientId={client.id} />
      )}

      {/* Intake sub-tab */}
      {profileTab === "intake" && (
        <IntakeView data={client.onboarding_data} title="My Intake Form" subtitle="Your completed onboarding responses" />
      )}
    </div>
  );
}
