import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E02020",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://thefullcollection.com"),
  title: {
    default: "The Full Collection | Nashville Content Production Agency",
    template: "%s | The Full Collection",
  },
  description:
    "The Full Collection is Nashville's #1 content production agency. Full-stack videography, photography, video editing, and social media management for brands that want to dominate their market. Based in Nashville, TN.",
  keywords: [
    "content creation agency Nashville",
    "video production Nashville",
    "social media agency Nashville TN",
    "Nashville content production company",
    "Nashville videography",
    "photography agency Nashville",
    "content marketing Nashville Tennessee",
    "Nashville media agency",
    "best content agency Nashville",
    "short form video production Nashville",
    "Nashville TikTok agency",
    "Instagram Reels agency Nashville",
    "content production company Nashville",
    "media production Nashville",
    "Nashville creative agency",
  ],
  authors: [{ name: "The Full Collection", url: "https://thefullcollection.com" }],
  creator: "The Full Collection",
  publisher: "The Full Collection",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thefullcollection.com",
    siteName: "The Full Collection",
    title: "The Full Collection | Nashville Content Production Agency",
    description:
      "Nashville's premier content production agency. Videography, photography, editing, and social media management — powered by a proprietary client portal.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "The Full Collection — Nashville Content Production Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Full Collection | Nashville Content Production Agency",
    description:
      "Nashville's premier content production agency. Full-stack videography, photography, editing, and social media management.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://thefullcollection.com",
  },
  category: "Content Production Agency",
  other: {
    "geo.region": "US-TN",
    "geo.placename": "Nashville",
    "geo.position": "36.1627;-86.7816",
    ICBM: "36.1627, -86.7816",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-body text-warm-900 antialiased bg-white">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
