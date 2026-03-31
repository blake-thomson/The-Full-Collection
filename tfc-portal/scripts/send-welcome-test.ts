import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { ClientWelcomeEmail } from "../emails/ClientWelcome";
import * as React from "react";

// Load from environment variables — never hardcode secrets
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TO = process.env.TEST_EMAIL || "blakethomson2@gmail.com";
const PORTAL_ACCOUNT_EMAIL = process.env.TEST_PORTAL_EMAIL || "blake@status10inc.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://portal.thefullcollection.com";

async function run() {
  if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing required env vars: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY");
    console.error("Run with: npx tsx --env-file=.env.local scripts/send-welcome-test.ts");
    process.exit(1);
  }

  // Generate a real recovery link pointing to the new /reset-password page
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: PORTAL_ACCOUNT_EMAIL,
    options: { redirectTo: `${APP_URL}/reset-password` },
  });

  if (error || !data?.properties?.action_link) {
    console.error("Failed to generate reset link:", error?.message);
    process.exit(1);
  }

  console.log("Reset link generated.");

  const result = await resend.emails.send({
    from: "The Full Collection <hello@thefullcollection.com>",
    to: TO,
    subject: "Welcome to The Full Collection — Your Portal is Ready",
    react: React.createElement(ClientWelcomeEmail, {
      name: "Blake Thomson",
      email: TO,
      code: "TFC-TEST-WELCOME",
      appUrl: APP_URL,
    }),
  });

  if (result.error) {
    console.error("Send failed:", result.error);
  } else {
    console.log("Welcome email sent to", TO);
  }
}

run().catch(console.error);
