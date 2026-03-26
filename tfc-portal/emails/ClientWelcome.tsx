import { Html, Head, Body, Container, Text, Button, Hr } from "@react-email/components";

interface Props {
  name: string;
  email: string;
  password: string;
  appUrl: string;
}

export function ClientWelcomeEmail({ name, email, password, appUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0A0A0A", fontFamily: "DM Sans, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 20px" }}>
          <Text style={{ color: "#E02020", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            THE FULL COLLECTION
          </Text>
          <Text style={{ color: "#F0EDE6", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Welcome, {name}
          </Text>
          <Text style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Your client portal account has been created. Sign in below to complete your onboarding and get your content strategy locked in.
          </Text>
          <Hr style={{ borderColor: "#252525", marginBottom: 24 }} />
          <Text style={{ color: "#5A5652", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 12 }}>
            Your login details
          </Text>
          <Text style={{ color: "#A8A49C", fontSize: 14, marginBottom: 4 }}>
            Email: <span style={{ color: "#F0EDE6", fontWeight: 600 }}>{email}</span>
          </Text>
          <Text style={{ color: "#A8A49C", fontSize: 14, marginBottom: 24 }}>
            Password: <span style={{ color: "#F0EDE6", fontWeight: 600 }}>{password}</span>
          </Text>
          <Button
            href={appUrl}
            style={{ background: "#E02020", color: "#fff", padding: "12px 28px", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, textDecoration: "none" }}
          >
            Sign In to Your Portal
          </Button>
          <Hr style={{ borderColor: "#252525", margin: "32px 0 16px" }} />
          <Text style={{ color: "#5A5652", fontSize: 12 }}>
            We recommend changing your password after your first login.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
