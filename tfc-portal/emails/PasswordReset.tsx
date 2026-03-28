import React from "react";
import {
  Html, Head, Preview, Body, Container, Section,
  Text, Button, Hr, Link,
} from "@react-email/components";

interface Props {
  email: string;
  resetLink: string;
  appUrl: string;
}

export function PasswordResetEmail({ email, resetLink }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your The Full Collection portal password — link expires in 24 hours.</Preview>
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
            <Text style={{ color: "#F0EDE6", fontSize: 28, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
              Reset your password.
            </Text>
            <Text style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              We received a password reset request for the account associated with{" "}
              <span style={{ color: "#F0EDE6", fontWeight: 600 }}>{email}</span>.
              If this was you, click below to set a new password.
            </Text>
          </Section>

          <Section style={{ background: "#151515", border: "1px solid #1E1E1E", borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}>
            <Text style={{ color: "#5A5652", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Account Email
            </Text>
            <Text style={{ color: "#F0EDE6", fontSize: 15, fontWeight: 600, margin: 0 }}>
              {email}
            </Text>
          </Section>

          <Section style={{ marginBottom: 36 }}>
            <Button
              href={resetLink}
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
              Reset Password →
            </Button>
            <Text style={{ color: "#5A5652", fontSize: 11, margin: "10px 0 0", textAlign: "center" }}>
              This link expires in 24 hours. If you didn't request this, you can safely ignore it.
            </Text>
          </Section>

          <Hr style={{ borderColor: "#1E1E1E", margin: "0 0 28px" }} />

          <Section>
            <Text style={{ color: "#5A5652", fontSize: 12, lineHeight: 1.7, margin: "0 0 8px" }}>
              Need help?{" "}
              <Link href="mailto:support@thefullcollection.com" style={{ color: "#A8A49C", textDecoration: "none" }}>
                support@thefullcollection.com
              </Link>
            </Text>
            <Text style={{ color: "#2E2E2E", fontSize: 11, margin: 0 }}>
              © {new Date().getFullYear()} The Full Collection.
            </Text>
          </Section>

        </Container>

        <Section style={{ backgroundColor: "#111111", borderTop: "1px solid #1E1E1E" }}>
          <Container style={{ maxWidth: 560, margin: "0 auto", padding: "16px 24px" }}>
            <Text style={{ color: "#2E2E2E", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0, textAlign: "center" }}>
              THE FULL COLLECTION — CLIENT PORTAL
            </Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}
