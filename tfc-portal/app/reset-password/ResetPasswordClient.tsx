"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { ErrBox } from "@/components/ui/ErrBox";

export default function ResetPasswordClient() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  useEffect(() => {
    // Supabase embeds the session tokens in the URL hash after the recovery link is clicked.
    // onAuthStateChange fires with PASSWORD_RECOVERY once those tokens are exchanged.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if there's already an active session (e.g. page refreshed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords don't match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
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
          {done ? (
            <div className="text-center py-4">
              <p className="text-[22px] mb-2">✓</p>
              <h2 className="text-text font-heading text-xl font-bold m-0 mb-2">Password set</h2>
              <p className="text-text-2 text-[13px] m-0">Taking you to your portal...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-4">
              <p className="text-text-2 text-[13px]">Verifying your link...</p>
            </div>
          ) : (
            <>
              <h2 className="text-text font-heading text-xl font-bold m-0 mb-1">Set your password</h2>
              <p className="text-text-2 text-[13px] m-0 mb-6">Choose a password to secure your portal account.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="tfc-label">New Password</label>
                  <input
                    className="tfc-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="tfc-label">Confirm Password</label>
                  <input
                    className="tfc-input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit(e as any)}
                  />
                </div>

                {err && <ErrBox msg={err} />}

                <button
                  type="submit"
                  disabled={busy}
                  className="tfc-btn-primary w-full mt-1"
                >
                  {busy ? "Saving..." : "Set Password and Sign In"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
