"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { ErrBox } from "@/components/ui/ErrBox";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");
  const router = useRouter();
  const supabase = createBrowserSupabase();

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
      setErr(
        error.message === "Invalid login credentials"
          ? "No account found. Your account is created by The Full Collection team — check your welcome email."
          : error.message
      );
      setBusy(false);
      return;
    }
    // Check if this is a client (not a team member)
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (teamMember) {
      setErr("This is a team account. Please use the Team Portal login.");
      await supabase.auth.signOut();
      setBusy(false);
      return;
    }

    // Check if client exists
    const { data: client } = await supabase
      .from("clients")
      .select("onboarding_complete")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (!client) {
      setErr("No client account found. Your account is created by The Full Collection team.");
      await supabase.auth.signOut();
      setBusy(false);
      return;
    }

    setBusy(false);
    router.push(client.onboarding_complete ? "/dashboard" : "/onboarding");
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
      if (res.ok) {
        setResetMsg("If an account exists with that email, a password reset link has been sent.");
        setResetEmail("");
      } else {
        const data = await res.json();
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
          <Logo size={15} sub="Client Portal" />
        </div>
        <div className="bg-surface border border-border rounded-2xl p-[32px_28px]">
          {!showForgot ? (
            <>
              <h2 className="text-text font-heading text-xl font-bold m-0 mb-1">Welcome back</h2>
              <p className="text-text-2 text-[13px] m-0 mb-6">Sign in to your client portal</p>
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="tfc-label">Email Address</label>
                  <input
                    className="tfc-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                  {busy ? "Please wait..." : "Sign In →"}
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
              <div className="bg-surface-3 border border-border-2 rounded-lg py-[11px] px-[14px] mt-[14px]">
                <p className="text-text-3 text-xs m-0 leading-relaxed">
                  Don&apos;t have an account? Your login is created by The Full Collection team. Check your welcome email for credentials.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-text font-heading text-xl font-bold m-0 mb-1">Reset Password</h2>
              <p className="text-text-2 text-[13px] m-0 mb-6">Enter your email and we&apos;ll send you a reset link.</p>
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="tfc-label">Email Address</label>
                  <input
                    className="tfc-input"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  />
                </div>
                {resetErr && <ErrBox msg={resetErr} />}
                {resetMsg && (
                  <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] rounded-lg py-2.5 px-3.5">
                    <p className="text-[#10B981] text-[12px] m-0">{resetMsg}</p>
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
          <div className="border-t border-border mt-[18px] pt-[18px] text-center">
            <button
              onClick={() => router.push("/team/login")}
              className="text-text-3 bg-transparent border-none cursor-pointer text-xs font-body"
            >
              TFC Team Portal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
