import React from "react";
import {
  Html, Head, Preview, Body, Container, Section,
  Text, Button, Hr, Link,
} from "@react-email/components";

interface Props {
  name: string;
  inviterName: string;
  role: string;
  code: string;
  appUrl: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  youtube_editor: "YouTube Editor",
  short_form_editor: "Short Form Editor",
  videographer: "Videographer",
  smm: "Social Media Manager",
  project_manager: "Project Manager",
  owner: "Owner",
};

export function TeamInviteEmail({ name, inviterName, role, code, appUrl }: Props) {
  const firstName = name.split(" ")[0] || name;
  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <Html lang="en">
      <Head />
      <Preview>{inviterName} has invited you to join The Full Collection team portal as {roleLabel}.</Preview>
      <Body style={{ backgroundColor: "#0A0A0A", fontFamily: "'DM Sans', Arial, sans-serif", margin: 0, padding: 0 }}>

        <Section style={{ backgroundColor: "#E02020", height: 4, display: "block" }}>
          <Text style={{ margin: 0, fontSize: 0 }}>&nbsp;</Text>
        </Section>

        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 48px" }}>

          <Section style={{ marginBottom: 40 }}>
            <Text style={{ color: "#E02020", fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", margin: 0 }}>
              THE FULL COLLECTION
            </Text>
          </Section>

          <Section style={{ marginBottom: 32 }}>
            <Text style={{ color: "#F0EDE6", fontSize: 30, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
              You're on the team, {firstName}.
            </Text>
            <Text style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              <span style={{ color: "#F0EDE6", fontWeight: 600 }}>{inviterName}</span> has invited you to join the TFC team portal as{" "}
              <span style={{ color: "#F0EDE6", fontWeight: 600 }}>{roleLabel}</span>.
              Use the code below to accept your invitation and set up your account.
            </Text>
          </Section>

          {/* Invite code */}
          <Section style={{ background: "#151515", border: "1px solid #1E1E1E", borderRadius: 12, padding: "24px", marginBottom: 28, textAlign: "center" }}>
            <Text style={{ color: "#5A5652", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 16px" }}>
              Your Invite Code
            </Text>
            <Text style={{
              color: "#F0EDE6", fontSize: 32, fontWeight: 800,
              fontFamily: "monospace", letterSpacing: "0.25em",
              background: "#0A0A0A", border: "1px solid #252525",
              borderRadius: 8, padding: "12px 24px",
              margin: "0 auto 0",
              display: "inline-block",
            }}>
              {code}
            </Text>
          </Section>

          {/* Steps */}
          <Section style={{ background: "#151515", border: "1px solid #1E1E1E", borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}>
            <Text style={{ color: "#5A5652", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 16px" }}>
              How to get started
            </Text>
            {[
              'Click "Accept Invite" below',
              "Enter your invite code",
              "Set your password",
              "You're in — start collaborating",
            ].map((step, i) => (
              <Text key={i} style={{ color: "#A8A49C", fontSize: 13, lineHeight: 1.6, margin: "0 0 8px" }}>
                <span style={{ color: "#E02020", fontWeight: 700, marginRight: 10 }}>{i + 1}.</span>
                {step}
              </Text>
            ))}
          </Section>

          <Section style={{ marginBottom: 36 }}>
            <Button
              href={`${appUrl}/team/accept?code=${code}`}
              style={{
                display: "block",
                background: "#E02020",
                color: "#fff",
                padding: "14px 32px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Accept Invite →
            </Button>
            <Text style={{ color: "#5A5652", fontSize: 11, margin: "10px 0 0", textAlign: "center" }}>
              This code is single-use and tied to your email address.
            </Text>
          </Section>

          <Hr style={{ borderColor: "#1E1E1E", margin: "0 0 28px" }} />

          <Section>
            <Text style={{ color: "#5A5652", fontSize: 12, lineHeight: 1.7, margin: "0 0 8px" }}>
              Questions?{" "}
              <Link href="mailto:support@thefullcollection.com" style={{ color: "#A8A49C", textDecoration: "none" }}>
                support@thefullcollection.com
              </Link>
            </Text>
            <Text style={{ color: "#2E2E2E", fontSize: 11, margin: 0 }}>
              © {new Date().getFullYear()} The Full Collection. If you weren't expecting this, you can safely ignore it.
            </Text>
          </Section>

        </Container>

        <Section style={{ backgroundColor: "#111111", borderTop: "1px solid #1E1E1E" }}>
          <Container style={{ maxWidth: 560, margin: "0 auto", padding: "16px 24px" }}>
            <Text style={{ color: "#2E2E2E", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0, textAlign: "center" }}>
              THE FULL COLLECTION — TEAM PORTAL
            </Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}
