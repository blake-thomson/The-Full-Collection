"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { ErrBox } from "@/components/ui/ErrBox";

const OAUTH_ERRORS: Record<string, string> = {
  no_account: "No team account found for that Google email. Check your invite email or contact your admin.",
  auth_failed: "Google sign-in failed. Please try again.",
  missing_code: "Something went wrong. Please try again.",
  no_email: "Could not retrieve your email from Google. Please try again.",
};

export default function TeamLoginClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [ownerExists, setOwnerExists] = useState(true);
  const [remember, setRemember] = useState(true);
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

  // Load remembered email + show OAuth errors
  useEffect(() => {
    const saved = localStorage.getItem("tfc_remembered_team_email");
    if (saved) setEmail(saved);

    const oauthErr = searchParams.get("error");
    if (oauthErr && OAUTH_ERRORS[oauthErr]) {
      setErr(OAUTH_ERRORS[oauthErr]);
    }
  }, [searchParams]);

  const submit = async () => {
    setErr("");
    if (!email.trim() || !password) {
      setErr("Please enter your email and password.");
      return;
    }
    setBusy(true);

    // Remember email preference
    if (remember) {
      localStorage.setItem("tfc_remembered_team_email", email.trim().toLowerCase());
    } else {
      localStorage.removeItem("tfc_remembered_team_email");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setErr("Incorrect email or password. Try again or sign in with Google.");
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

  const signInWithGoogle = async () => {
    setErr("");
    setGoogleBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?portal=team`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) {
      setErr("Failed to start Google sign-in. Please try again.");
      setGoogleBusy(false);
    }
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

              {/* Google OAuth */}
              <button
                onClick={signInWithGoogle}
                disabled={googleBusy}
                className="w-full flex items-center justify-center gap-2.5 bg-surface border border-border rounded-xl py-[11px] px-4 text-text text-[14px] font-semibold font-body cursor-pointer hover:bg-surface-2 transition-colors disabled:opacity-50 mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58z" fill="#EA4335"/>
                </svg>
                {googleBusy ? "Redirecting..." : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-text-3 text-[11px] font-semibold uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

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
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-3.5 h-3.5 accent-red rounded"
                    />
                    <span className="text-text-3 text-[12px]">Remember me</span>
                  </label>
                  <button
                    onClick={() => { setShowForgot(true); setResetEmail(email); setResetErr(""); setResetMsg(""); }}
                    className="text-text-3 bg-transparent border-none cursor-pointer text-[12px] font-semibold font-body hover:text-text transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                {err && <ErrBox msg={err} />}
                <button className="tfc-btn w-full mt-1" onClick={submit} disabled={busy}>
                  {busy ? "Signing in..." : "Sign In →"}
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
