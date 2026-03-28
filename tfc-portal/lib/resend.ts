import React from "react";
import { Resend } from "resend";
import { renderAsync } from "@react-email/render";
import { TeamInviteEmail } from "@/emails/TeamInvite";
import { ClientWelcomeEmail } from "@/emails/ClientWelcome";
import { StatusNotificationEmail } from "@/emails/StatusNotification";
import { PasswordResetEmail } from "@/emails/PasswordReset";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

const FROM = "The Full Collection <hello@thefullcollection.com>";

export async function sendTeamInvite({
  to,
  name,
  inviterName,
  role,
  code,
}: {
  to: string;
  name: string;
  inviterName: string;
  role: string;
  code: string;
}) {
  const html = await renderAsync(
    React.createElement(TeamInviteEmail, {
      name,
      inviterName,
      role,
      code,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    })
  );
  return resend.emails.send({
    from: FROM,
    to,
    subject: "You've been invited to join The Full Collection team",
    html,
  });
}

export async function sendClientWelcome({
  to,
  name,
  email,
  code,
  appUrl,
}: {
  to: string;
  name: string;
  email: string;
  code: string;
  appUrl: string;
}) {
  const html = await renderAsync(
    React.createElement(ClientWelcomeEmail, {
      name,
      email,
      code,
      appUrl,
    })
  );
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to The Full Collection — Your Portal is Ready",
    html,
  });
}

export async function sendStatusNotification({
  to,
  clientName,
  contentTitle,
  oldStatus,
  newStatus,
}: {
  to: string;
  clientName: string;
  contentTitle: string;
  oldStatus: string;
  newStatus: string;
}) {
  const html = await renderAsync(
    React.createElement(StatusNotificationEmail, {
      clientName,
      contentTitle,
      oldStatus,
      newStatus,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    })
  );
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Content Update: "${contentTitle}" moved to ${newStatus}`,
    html,
  });
}

export async function sendPasswordReset({
  to,
  resetLink,
}: {
  to: string;
  resetLink: string;
}) {
  const html = await renderAsync(
    React.createElement(PasswordResetEmail, {
      email: to,
      resetLink,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    })
  );
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reset Your Password — The Full Collection",
    html,
  });
}
