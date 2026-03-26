import { Resend } from "resend";
import { TeamInviteEmail } from "@/emails/TeamInvite";
import { ClientWelcomeEmail } from "@/emails/ClientWelcome";

const resend = new Resend(process.env.RESEND_API_KEY);
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
  password,
}: {
  to: string;
  name: string;
  email: string;
  password: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to The Full Collection — Your Portal is Ready",
    react: ClientWelcomeEmail({
      name,
      email,
      password,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    }),
  });
}
