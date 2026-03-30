"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { ErrBox } from "@/components/ui/ErrBox";

export default function SetupClient() {
  const searchParams = useSearchParams();
  const [setupCode, setSetupCode] = useState(searchParams.get("code")?.toUpperCase() || "");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  const submit = async () => {
    setErr("");
    const code = setupCode.trim().toUpperCase();
    if (!code || !password || !confirmPass) {
      setErr("Please fill in all fields.");
      return;
    }
    if (password !== confirmPass) {
      setErr("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);

    // Activate: creates auth user and clears the setup code
    const activateRes = await fetch("/api/clients/setup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, password }),
    });
    const activateData = await activateRes.json();
    if (!activateRes.ok) {
      setErr(activateData.error || "Failed to activate account.");
      setBusy(false);
      return;
    }

    // Sign in with the new credentials
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: activateData.email,
      password,
    });
    if (signInError) {
      setErr(signInError.message);
      setBusy(false);
      return;
    }

    router.push("/onboarding");
  };

  return (
    <div className="bg-bg min-h-screen flex items-center justify-center">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 15% 60%, rgba(224,32,32,0.05) 0%, transparent 60%)" }}
      />
      <div className="w-full max-w-[440px] px-5 relative">
        <div className="text-center mb-9">
          <Logo size={15} />
        </div>
        <div className="bg-surface border border-red/30 rounded-2xl p-[32px_28px]">
          <h2 className="text-text font-heading text-xl font-bold m-0 mb-1 text-center">Activate Your Account</h2>
          <p className="text-text-2 text-[13px] m-0 mb-6 text-center">
            Enter the setup code from your welcome email and create your password.
          </p>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="tfc-label">Setup Code</label>
              <input
                className="tfc-input"
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD34"
                style={{ letterSpacing: "0.12em", fontWeight: 600 }}
              />
            </div>
            <div>
              <label className="tfc-label">Password</label>
              <input
                className="tfc-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
              />
            </div>
            <div>
              <label className="tfc-label">Confirm Password</label>
              <input
                className="tfc-input"
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
            {err && <ErrBox msg={err} />}
            <button className="tfc-btn w-full mt-1" onClick={submit} disabled={busy}>
              {busy ? "Activating..." : "Activate Account →"}
            </button>
          </div>
          <p className="text-center mt-[18px] text-[13px] text-text-2">
            <button
              onClick={() => router.push("/login")}
              className="text-red bg-transparent border-none cursor-pointer text-[13px] font-semibold p-0 font-body"
            >
              ← Back to login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
