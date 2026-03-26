"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { ErrBox } from "@/components/ui/ErrBox";

export default function OwnerSetupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  useEffect(() => {
    supabase
      .from("team_members")
      .select("id")
      .eq("role", "owner")
      .limit(1)
      .then(({ data }) => {
        const exists = !!(data && data.length > 0);
        setOwnerExists(exists);
        if (exists) router.replace("/team/login");
      });
  }, [supabase, router]);

  const submit = async () => {
    setErr("");
    if (!name.trim() || !email.trim() || !password || !confirmPass) {
      setErr("Please fill in all fields.");
      return;
    }
    if (password !== confirmPass) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);

    // Create auth user
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signUpError) {
      setErr(signUpError.message);
      setBusy(false);
      return;
    }

    // Sign in immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signInError) {
      setErr(signInError.message);
      setBusy(false);
      return;
    }

    // Insert team member
    const { error: insertError } = await supabase.from("team_members").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "owner",
    });
    if (insertError) {
      setErr(insertError.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    router.push("/team/portal");
  };

  if (ownerExists === null) return null;

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
            <span className="team-badge">Owner Setup</span>
          </div>
          <h2 className="text-text font-heading text-xl font-bold m-0 mb-1 text-center">Create Owner Account</h2>
          <p className="text-text-2 text-[13px] m-0 mb-6 text-center">
            One-time setup for the first owner. Once created, all new members must be invited.
          </p>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="tfc-label">Full Name</label>
              <input className="tfc-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="tfc-label">Email Address</label>
              <input className="tfc-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@thefullcollection.com" />
            </div>
            <div>
              <label className="tfc-label">Password</label>
              <input className="tfc-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" />
            </div>
            <div>
              <label className="tfc-label">Confirm Password</label>
              <input className="tfc-input" type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Confirm password" />
            </div>
            {err && <ErrBox msg={err} />}
            <button className="tfc-btn w-full mt-1" onClick={submit} disabled={busy}>
              {busy ? "Creating..." : "Create Owner Account →"}
            </button>
          </div>
          <p className="text-center mt-[18px] text-[13px] text-text-2">
            <button
              onClick={() => router.push("/team/login")}
              className="text-red bg-transparent border-none cursor-pointer text-[13px] font-semibold p-0 font-body"
            >
              ← Back to team login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
