"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { ErrBox } from "@/components/ui/ErrBox";

export default function TeamLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [ownerExists, setOwnerExists] = useState(true);
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
        <div className="bg-surface border border-[rgba(224,32,32,0.3)] rounded-2xl p-[32px_28px]">
          <div className="flex justify-center mb-4">
            <span className="team-badge">TFC Team</span>
          </div>
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
          <div className="border-t border-border mt-[18px] pt-[18px] flex flex-col gap-2.5 items-center">
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
        </div>
      </div>
    </div>
  );
}
