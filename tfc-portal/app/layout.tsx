import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Full Collection — Client Portal",
  description: "Content strategy portal for The Full Collection clients and team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
