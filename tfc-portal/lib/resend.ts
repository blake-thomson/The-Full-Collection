import { Resend } from "resend";
import { TeamInviteEmail } from "@/emails/TeamInvite";
import { ClientWelcomeEmail } from "@/emails/ClientWelcome";
import { StatusNotificationEmail } from "@/emails/StatusNotification";
import { PasswordResetEmail } from "@/emails/PasswordReset";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

// TODO: Change FROM to 'The Full Collection <hello@thefullcollection.com>' once the domain is verified in Resend.
// Using the Resend test address until then.
const FROM = "The Full Collection <onboarding@resend.dev>";

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
  return resend.emails.send({
    from: FROM,
    to,
    subject: "You've been invited to join The Full Collection team",
    react: TeamInviteEmail({
      name,
      inviterName,
      role,
      code,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    }),
  });
}

export async function sendClientWelcome({
  to,
  name,
  email,
  resetLink,
}: {
  to: string;
  name: string;
  email: string;
  resetLink?: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to The Full Collection — Your Portal is Ready",
    react: ClientWelcomeEmail({
      name,
      email,
      resetLink,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    }),
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
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Content Update: "${contentTitle}" moved to ${newStatus}`,
    react: StatusNotificationEmail({
      clientName,
      contentTitle,
      oldStatus,
      newStatus,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    }),
  });
}

export async function sendPasswordReset({
  to,
  resetLink,
}: {
  to: string;
  resetLink: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reset Your Password — The Full Collection",
    react: PasswordResetEmail({
      email: to,
      resetLink,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    }),
  });
}
