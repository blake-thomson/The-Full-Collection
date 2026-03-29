import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { ClientWelcomeEmail } from "../emails/ClientWelcome";
import * as React from "react";

const resend = new Resend("re_4XrjUwWJ_NF3aK8CZt7aVCcAcBBkKNnRG");
const supabase = createClient(
  "https://ojgaphhkajdurzkysprc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZ2FwaGhrYWpkdXJ6a3lzcHJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU1MDMxNiwiZXhwIjoyMDkwMTI2MzE2fQ.z-gryaHDi6AnX9V1naqBNKcl7n_KWIzetqQBB8Z12-A"
);

const TO = "blakethomson2@gmail.com";
const PORTAL_ACCOUNT_EMAIL = "blake@status10inc.com"; // existing Supabase auth user
const APP_URL = "https://portal.thefullcollection.com";

async function run() {
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

  const resetLink = data.properties.action_link;
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
    console.log("✅ Welcome email sent to", TO);
  }
}

run().catch(console.error);
