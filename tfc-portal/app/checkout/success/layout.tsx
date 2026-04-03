import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome — The Full Collection",
  description: "Your subscription is confirmed. Welcome to The Full Collection.",
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
