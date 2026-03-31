import { Resend } from "resend";
import { ClientWelcomeEmail } from "../emails/ClientWelcome";
import { PasswordResetEmail } from "../emails/PasswordReset";
import { TeamInviteEmail } from "../emails/TeamInvite";
import { StatusNotificationEmail } from "../emails/StatusNotification";
import * as React from "react";

// Load from environment variables — never hardcode secrets
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "The Full Collection <hello@thefullcollection.com>";
const TO = process.env.TEST_EMAIL || "blakethomson2@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://portal.thefullcollection.com";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run() {
  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY env var.");
    console.error("Run with: npx tsx --env-file=.env.local scripts/send-test-emails.ts");
    process.exit(1);
  }

  console.log("Sending email 1/4: Client Welcome...");
  await resend.emails.send({
    from: FROM,
    to: TO,
    subject: "Welcome to The Full Collection — Your Portal is Ready",
    react: React.createElement(ClientWelcomeEmail, {
      name: "Blake Thomson",
      email: TO,
      code: "TFC-TEST-WELCOME",
      appUrl: APP_URL,
    }),
  });
  console.log("Sent. Waiting 2 minutes...");
  await delay(120_000);

  console.log("Sending email 2/4: Password Reset...");
  await resend.emails.send({
    from: FROM,
    to: TO,
    subject: "Reset Your Password — The Full Collection",
    react: React.createElement(PasswordResetEmail, {
      email: TO,
      resetLink: `${APP_URL}/reset?token=test456`,
      appUrl: APP_URL,
    }),
  });
  console.log("Sent. Waiting 2 minutes...");
  await delay(120_000);

  console.log("Sending email 3/4: Team Invite...");
  await resend.emails.send({
    from: FROM,
    to: TO,
    subject: "You've been invited to join The Full Collection team",
    react: React.createElement(TeamInviteEmail, {
      name: "Blake Thomson",
      inviterName: "TFC Admin",
      role: "editor",
      code: "TFC-TEST",
      appUrl: APP_URL,
    }),
  });
  console.log("Sent. Waiting 2 minutes...");
  await delay(120_000);

  console.log("Sending email 4/4: Status Notification...");
  await resend.emails.send({
    from: FROM,
    to: TO,
    subject: 'Content Update: "Brand Shoot BTS" moved to Review',
    react: React.createElement(StatusNotificationEmail, {
      clientName: "Blake Thomson",
      contentTitle: "Brand Shoot BTS",
      oldStatus: "Editing",
      newStatus: "Review",
      appUrl: APP_URL,
    }),
  });
  console.log("All 4 emails sent.");
}

run().catch(console.error);
