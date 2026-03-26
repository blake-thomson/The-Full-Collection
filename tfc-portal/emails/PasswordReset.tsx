import { Html, Head, Body, Container, Text, Button, Hr } from "@react-email/components";

interface Props {
  email: string;
  resetLink: string;
  appUrl: string;
}

export function PasswordResetEmail({ email, resetLink, appUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0A0A0A", fontFamily: "DM Sans, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 20px" }}>
          <Text style={{ color: "#E02020", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            THE FULL COLLECTION
          </Text>
          <Text style={{ color: "#F0EDE6", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Reset Your Password
          </Text>
          <Text style={{ color: "#A8A49C", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            We received a request to reset the password for the account associated with{" "}
            <span style={{ color: "#F0EDE6", fontWeight: 600 }}>{email}</span>.
            Click the button below to set a new password.
          </Text>
          <Button
            href={resetLink}
            style={{ background: "#E02020", color: "#fff", padding: "12px 28px", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, textDecoration: "none" }}
          >
            Reset Password
          </Button>
          <Hr style={{ borderColor: "#252525", margin: "32px 0 16px" }} />
          <Text style={{ color: "#5A5652", fontSize: 12, lineHeight: 1.6 }}>
            This link will expire in 24 hours. If you did not request a password reset, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
