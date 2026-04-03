import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — The Full Collection",
  description: "Choose your content production plan and get started with The Full Collection.",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
