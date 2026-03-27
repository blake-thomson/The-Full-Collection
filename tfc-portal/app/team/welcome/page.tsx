import { Suspense } from "react";
import WelcomeClient from "./WelcomeClient";

export default function WelcomePage() {
  return (
    <Suspense fallback={<div style={{ background: "#0A0A0A", minHeight: "100vh" }} />}>
      <WelcomeClient />
    </Suspense>
  );
}
