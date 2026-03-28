import React from "react";
import {
  Html, Head, Preview, Body, Container, Section,
  Text, Button, Hr, Link,
} from "@react-email/components";

interface Props {
  clientName: string;
  contentTitle: string;
  oldStatus: string;
  newStatus: string;
  appUrl: string;
}

const STATUS_COLORS: Record<string, string> = {
  idea: "#6B7280",
  scripted: "#8B5CF6",
  filmed: "#3B82F6",
  editing: "#F59E0B",
  review: "#EC4899",
  approved: "#10B981",
  published: "#10B981",
};

export function StatusNotificationEmail({ clientName, contentTitle, oldStatus, newStatus, appUrl }: Props) {
  const firstName = clientName.split(" ")[0] || clientName;
  const newColor = STATUS_COLORS[newStatus.toLowerCase()] || "#E02020";

  return (
    <Html lang="en">
      <Head />
      <Preview>"{contentTitle}" has moved to {newStatus} — view it in your portal.</Preview>
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
              Content update, {firstName}.
            </Text>
            <Text style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              A piece of content in your portal has moved to a new stage.
            </Text>
          </Section>

          {/* Content card */}
          <Section style={{ background: "#151515", border: "1px solid #1E1E1E", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
            <Text style={{ color: "#5A5652", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Content
            </Text>
            <Text style={{ color: "#F0EDE6", fontSize: 17, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
              {contentTitle}
            </Text>
          </Section>

          {/* Status arrow */}
          <Section style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}>
            <Text style={{ color: "#5A5652", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 16px" }}>
              Status Change
            </Text>
            <Text style={{ margin: 0, fontSize: 15 }}>
              <span style={{
                color: "#5A5652",
                background: "#151515",
                border: "1px solid #252525",
                borderRadius: 6,
                padding: "4px 12px",
                fontWeight: 600,
              }}>
                {oldStatus}
              </span>
              <span style={{ color: "#3A3A3A", margin: "0 12px", fontSize: 18 }}>→</span>
              <span style={{
                color: newColor,
                background: `${newColor}18`,
                border: `1px solid ${newColor}40`,
                borderRadius: 6,
                padding: "4px 12px",
                fontWeight: 700,
              }}>
                {newStatus}
              </span>
            </Text>
          </Section>

          <Section style={{ marginBottom: 36 }}>
            <Button
              href={`${appUrl}/dashboard`}
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
              View in Portal →
            </Button>
          </Section>

          <Hr style={{ borderColor: "#1E1E1E", margin: "0 0 28px" }} />

          <Section>
            <Text style={{ color: "#5A5652", fontSize: 12, lineHeight: 1.7, margin: "0 0 8px" }}>
              Questions about your content? Reply to this email or message the team directly in your portal.{" "}
              <Link href="mailto:support@thefullcollection.com" style={{ color: "#A8A49C", textDecoration: "none" }}>
                support@thefullcollection.com
              </Link>
            </Text>
            <Text style={{ color: "#2E2E2E", fontSize: 11, margin: 0 }}>
              © {new Date().getFullYear()} The Full Collection. You're receiving this because content in your portal was updated.
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
