import { Resend } from "resend";
import { ClientWelcomeEmail } from "../emails/ClientWelcome";
import { PasswordResetEmail } from "../emails/PasswordReset";
import { TeamInviteEmail } from "../emails/TeamInvite";
import { StatusNotificationEmail } from "../emails/StatusNotification";
import * as React from "react";

const resend = new Resend("re_4XrjUwWJ_NF3aK8CZt7aVCcAcBBkKNnRG");
const FROM = "The Full Collection <hello@thefullcollection.com>";
const TO = "blakethomson2@gmail.com";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log("Sending email 1/4: Client Welcome...");
  await resend.emails.send({
    from: FROM,
    to: TO,
    subject: "Welcome to The Full Collection — Your Portal is Ready",
    react: React.createElement(ClientWelcomeEmail, {
      name: "Blake Thomson",
      email: TO,
      code: "TFC-TEST-WELCOME",
      appUrl: "https://portal.thefullcollection.com",
    }),
  });
  console.log("✅ Sent. Waiting 2 minutes...");
  await delay(120_000);

  console.log("Sending email 2/4: Password Reset...");
  await resend.emails.send({
    from: FROM,
    to: TO,
    subject: "Reset Your Password — The Full Collection",
    react: React.createElement(PasswordResetEmail, {
      email: TO,
      resetLink: "https://portal.thefullcollection.com/reset?token=test456",
      appUrl: "https://portal.thefullcollection.com",
    }),
  });
  console.log("✅ Sent. Waiting 2 minutes...");
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
      appUrl: "https://portal.thefullcollection.com",
    }),
  });
  console.log("✅ Sent. Waiting 2 minutes...");
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
      appUrl: "https://portal.thefullcollection.com",
    }),
  });
  console.log("✅ All 4 emails sent.");
}

run().catch(console.error);
