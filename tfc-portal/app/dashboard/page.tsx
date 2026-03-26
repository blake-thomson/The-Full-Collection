"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Kanban } from "@/components/Kanban";
import { IntakeView } from "@/components/IntakeView";
import type { OnboardingData } from "@/lib/constants";

interface ClientData {
  id: string;
  name: string;
  email: string;
  onboarding_complete: boolean;
  onboarding_data: OnboardingData | null;
  created_at: string;
}

export default function DashboardPage() {
  const [tab, setTab] = useState("kanban");
  const [client, setClient] = useState<ClientData | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!data) { router.push("/login"); return; }
      if (!data.onboarding_complete) { router.push("/onboarding"); return; }
      setClient(data);
    })();
  }, [supabase, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!client) return null;

  return (
    <div className="bg-bg h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-6 h-[58px] flex items-center justify-between shrink-0">
        <Logo size={13} />
        <div className="flex gap-[3px]">
          {[
            { id: "kanban", label: "Content Tracker" },
            { id: "intake", label: "My Intake" },
            { id: "profile", label: "Profile" },
          ].map((t) => (
            <button key={t.id} className={`nav-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={client.name} />
            <span className="text-text text-[13px] font-medium">{client.name}</span>
          </div>
          <button onClick={logout} className="text-text-3 bg-transparent border-none cursor-pointer text-xs font-body">
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 ${tab === "kanban" ? "overflow-hidden" : "overflow-auto"}`}>
        {tab === "kanban" && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-3.5 border-b border-border flex items-center gap-6 shrink-0">
              <h2 className="text-text font-heading text-[17px] font-bold m-0">Content Tracker</h2>
            </div>
            <Kanban clientId={client.id} />
          </div>
        )}
        {tab === "intake" && <IntakeView data={client.onboarding_data} title="My Intake Form" subtitle="Your completed onboarding responses" />}
        {tab === "profile" && (
          <div className="p-8 max-w-[460px] mx-auto">
            <h2 className="text-text font-heading text-[22px] font-[800] mb-7">Profile</h2>
            <div className="bg-surface border border-border rounded-2xl p-7">
              <div className="flex items-center gap-4 pb-[22px] border-b border-border mb-[22px]">
                <Avatar name={client.name} size={52} />
                <div>
                  <div className="text-text text-[17px] font-bold">{client.name}</div>
                  <div className="text-text-2 text-[13px] mt-0.5">{client.email}</div>
                </div>
              </div>
              {[
                { l: "Member Since", v: new Date(client.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                { l: "Onboarding", v: client.onboarding_complete ? "Complete" : "Pending", color: client.onboarding_complete ? "#10B981" : "#F59E0B" },
              ].map((row) => (
                <div key={row.l} className="flex justify-between py-2.5 border-b border-border">
                  <span className="text-text-3 text-[13px]">{row.l}</span>
                  <span className="text-[13px] font-semibold" style={{ color: row.color || "#F0EDE6" }}>{row.v}</span>
                </div>
              ))}
              <button className="tfc-btn-ghost w-full text-center mt-6" onClick={logout}>Sign Out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
