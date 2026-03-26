import { Html, Head, Body, Container, Text, Button, Hr, Section } from "@react-email/components";

interface Props {
  clientName: string;
  contentTitle: string;
  oldStatus: string;
  newStatus: string;
  appUrl: string;
}

export function StatusNotificationEmail({
  clientName,
  contentTitle,
  oldStatus,
  newStatus,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0A0A0A", fontFamily: "DM Sans, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 20px" }}>
          <Text style={{ color: "#E02020", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            THE FULL COLLECTION
          </Text>
          <Text style={{ color: "#F0EDE6", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Content Status Updated
          </Text>
          <Text style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Hi {clientName}, a piece of content in your portal has been updated.
          </Text>
          <Hr style={{ borderColor: "#252525", marginBottom: 24 }} />

          {/* Content title */}
          <Text style={{ color: "#5A5652", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>
            Content
          </Text>
          <Text style={{ color: "#F0EDE6", fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
            {contentTitle}
          </Text>

          {/* Status change */}
          <Section style={{ background: "#181818", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
            <Text style={{ color: "#5A5652", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 12, marginTop: 0 }}>
              Status Change
            </Text>
            <Text style={{ color: "#F0EDE6", fontSize: 16, marginTop: 0, marginBottom: 0 }}>
              <span style={{ color: "#A8A49C" }}>{oldStatus}</span>
              <span style={{ color: "#5A5652", margin: "0 12px" }}>&rarr;</span>
              <span style={{ color: "#E02020", fontWeight: 700 }}>{newStatus}</span>
            </Text>
          </Section>

          <Button
            href={`${appUrl}/dashboard`}
            style={{ background: "#E02020", color: "#fff", padding: "12px 28px", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, textDecoration: "none" }}
          >
            View in Portal
          </Button>
          <Hr style={{ borderColor: "#252525", margin: "32px 0 16px" }} />
          <Text style={{ color: "#5A5652", fontSize: 12 }}>
            You&apos;re receiving this because content in your portal was updated. If you have questions, reply to this email or reach out to your TFC team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
