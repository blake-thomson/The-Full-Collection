"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { ErrBox } from "@/components/ui/ErrBox";

export default function TeamLoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [ownerExists, setOwnerExists] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [resetLink, setResetLink] = useState("");
  const router = useRouter();
  const supabase = createBrowserSupabase();

  useEffect(() => {
    supabase
      .from("team_members")
      .select("id")
      .eq("role", "owner")
      .limit(1)
      .then(({ data }) => setOwnerExists(!!(data && data.length > 0)));
  }, [supabase]);

  const submit = async () => {
    setErr("");
    if (!email.trim() || !password) {
      setErr("Please enter your email and password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setErr("No team account found. Check your invite email.");
      setBusy(false);
      return;
    }
    // Verify they are a team member
    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (!member) {
      setErr("No team account found. Check your invite email.");
      await supabase.auth.signOut();
      setBusy(false);
      return;
    }
    setBusy(false);
    router.push("/team/portal");
  };

  const handleResetPassword = async () => {
    setResetErr("");
    setResetMsg("");
    if (!resetEmail.trim()) {
      setResetErr("Please enter your email address.");
      return;
    }
    setResetBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg(data.message || "Password reset link sent.");
        setResetLink(data.resetLink || "");
        setResetEmail("");
      } else {
        setResetErr(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setResetErr("Network error. Please try again.");
    }
    setResetBusy(false);
  };

  return (
    <div className="bg-bg min-h-screen flex items-center justify-center">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 15% 60%, rgba(224,32,32,0.05) 0%, transparent 60%)" }}
      />
      <div className="w-full max-w-[440px] px-5 relative">
        <div className="text-center mb-9">
          <Logo size={15} sub="Team Portal" />
        </div>
        <div className="bg-surface border border-red/30 rounded-2xl p-[32px_28px]">
          <div className="flex justify-center mb-4">
            <span className="team-badge">TFC Team</span>
          </div>
          {!showForgot ? (
            <>
              <h2 className="text-text font-heading text-xl font-bold m-0 mb-1 text-center">Team Sign In</h2>
              <p className="text-text-2 text-[13px] m-0 mb-6 text-center">Sign in with your team credentials</p>
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="tfc-label">Email Address</label>
                  <input
                    className="tfc-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@thefullcollection.com"
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                  />
                </div>
                <div>
                  <label className="tfc-label">Password</label>
                  <input
                    className="tfc-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                  />
                </div>
                {err && <ErrBox msg={err} />}
                <button className="tfc-btn w-full mt-1" onClick={submit} disabled={busy}>
                  {busy ? "Signing in..." : "Sign In →"}
                </button>
              </div>
              <div className="text-center mt-4">
                <button
                  onClick={() => { setShowForgot(true); setResetEmail(email); setResetErr(""); setResetMsg(""); }}
                  className="text-text-3 bg-transparent border-none cursor-pointer text-[12px] font-semibold font-body hover:text-text transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="border-t border-border mt-[14px] pt-[18px] flex flex-col gap-2.5 items-center">
                <p className="text-[13px] text-text-2 m-0">
                  New team member?{" "}
                  <button
                    onClick={() => router.push("/team/accept")}
                    className="text-red bg-transparent border-none cursor-pointer text-[13px] font-semibold p-0 font-body"
                  >
                    Redeem your invite
                  </button>
                </p>
                {!ownerExists && (
                  <p className="text-[13px] text-text-2 m-0">
                    First time?{" "}
                    <button
                      onClick={() => router.push("/team/setup")}
                      className="text-red bg-transparent border-none cursor-pointer text-[13px] font-semibold p-0 font-body"
                    >
                      Create owner account
                    </button>
                  </p>
                )}
                <button
                  onClick={() => router.push("/login")}
                  className="text-text-3 bg-transparent border-none cursor-pointer text-xs font-body mt-1"
                >
                  ← Client portal
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-text font-heading text-xl font-bold m-0 mb-1 text-center">Reset Password</h2>
              <p className="text-text-2 text-[13px] m-0 mb-6 text-center">Enter your email and we&apos;ll send you a reset link.</p>
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="tfc-label">Email Address</label>
                  <input
                    className="tfc-input"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@thefullcollection.com"
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  />
                </div>
                {resetErr && <ErrBox msg={resetErr} />}
                {resetMsg && (
                  <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] rounded-lg py-2.5 px-3.5 flex flex-col gap-2">
                    <p className="text-[#10B981] text-[12px] m-0">{resetMsg}</p>
                    {resetLink && (
                      <a
                        href={resetLink}
                        className="text-[#10B981] text-[12px] font-semibold underline break-all"
                      >
                        Click here to reset your password →
                      </a>
                    )}
                  </div>
                )}
                <button className="tfc-btn w-full mt-1" onClick={handleResetPassword} disabled={resetBusy}>
                  {resetBusy ? "Sending..." : "Send Reset Link"}
                </button>
                <button
                  onClick={() => setShowForgot(false)}
                  className="text-text-3 bg-transparent border-none cursor-pointer text-[12px] font-semibold font-body hover:text-text transition-colors text-center"
                >
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
