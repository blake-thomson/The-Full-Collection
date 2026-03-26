import { Html, Head, Body, Container, Text, Button, Hr } from "@react-email/components";

interface Props {
  name: string;
  inviterName: string;
  role: string;
  code: string;
  appUrl: string;
}

export function TeamInviteEmail({ name, inviterName, role, code, appUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0A0A0A", fontFamily: "DM Sans, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 20px" }}>
          <Text style={{ color: "#E02020", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            THE FULL COLLECTION
          </Text>
          <Text style={{ color: "#F0EDE6", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            You&apos;ve been invited
          </Text>
          <Text style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Hi {name}, {inviterName} has invited you to join The Full Collection team portal as {role === "admin" ? "an Admin" : "an Editor"}.
          </Text>
          <Hr style={{ borderColor: "#252525", marginBottom: 24 }} />
          <Text style={{ color: "#5A5652", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>
            Your invite code
          </Text>
          <Text style={{ color: "#F0EDE6", fontSize: 28, fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.2em", marginBottom: 24, background: "#181818", padding: "12px 20px", borderRadius: 8 }}>
            {code}
          </Text>
          <Text style={{ color: "#A8A49C", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            To accept your invitation:<br />
            1. Go to the TFC Client Portal<br />
            2. Click &quot;TFC Team Portal&quot; at the bottom of the login screen<br />
            3. Click &quot;Redeem your invite&quot;<br />
            4. Enter your code above and set your password
          </Text>
          <Button
            href={`${appUrl}/team/accept?code=${code}`}
            style={{ background: "#E02020", color: "#fff", padding: "12px 28px", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, textDecoration: "none" }}
          >
            Accept Invite
          </Button>
          <Hr style={{ borderColor: "#252525", margin: "32px 0 16px" }} />
          <Text style={{ color: "#5A5652", fontSize: 12 }}>
            This code is single-use and tied to your email address. If you weren&apos;t expecting this, you can ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
