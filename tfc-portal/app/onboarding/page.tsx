"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import type { OnboardingData } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();

  const handleComplete = async (data: OnboardingData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase
      .from("clients")
      .update({ onboarding_complete: true, onboarding_data: data })
      .eq("email", user.email);

    router.push("/dashboard");
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}
