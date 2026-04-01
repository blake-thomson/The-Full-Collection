import type { Metadata } from "next";
import { BookingContent } from "./BookingContent";

export const metadata: Metadata = {
  title: "Book a Call",
  description:
    "Schedule a free strategy call with The Full Collection — Nashville's premier content production agency. Videography, photography, editing, and social media management.",
  alternates: { canonical: "https://thefullcollection.com/book" },
  openGraph: {
    title: "Book a Call | The Full Collection",
    description:
      "Pick a time that works for you. We'll talk about your brand, your content goals, and exactly what The Full Collection can build for you.",
    url: "https://thefullcollection.com/book",
  },
};

export default function BookPage() {
  return <BookingContent />;
}
