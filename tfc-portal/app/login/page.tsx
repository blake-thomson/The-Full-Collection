"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { ErrBox } from "@/components/ui/ErrBox";

export default function ClientLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
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
          <div className="bg-surface-3 border border-border-2 rounded-lg py-[11px] px-[14px] mt-[18px]">
            <p className="text-text-3 text-xs m-0 leading-relaxed">
              Don&apos;t have an account? Your login is created by The Full Collection team. Check your welcome email for credentials.
            </p>
          </div>
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
