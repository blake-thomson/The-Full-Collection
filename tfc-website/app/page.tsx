import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { VSL } from "@/components/VSL";
import { Services } from "@/components/Services";
import { Portal } from "@/components/Portal";
import { Work } from "@/components/Work";
import { Pricing } from "@/components/Pricing";
import { Process } from "@/components/Process";
import { About } from "@/components/About";
import { Team } from "@/components/Team";
import { Locations } from "@/components/Locations";
import { Contact } from "@/components/Contact";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://thefullcollection.com",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": "https://thefullcollection.com/#organization",
      name: "The Full Collection",
      description:
        "Nashville's premier content production agency offering full-stack videography, photography, video editing, social media management, and content strategy. Serving brands and businesses across Nashville, Tennessee and beyond.",
      url: "https://thefullcollection.com",
      logo: "https://thefullcollection.com/status10-logo.png",
      image: "https://thefullcollection.com/opengraph-image",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Nashville",
        addressRegion: "TN",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 36.1627,
        longitude: -86.7816,
      },
      areaServed: [
        { "@type": "City", name: "Nashville", sameAs: "https://en.wikipedia.org/wiki/Nashville,_Tennessee" },
        { "@type": "State", name: "Tennessee" },
        { "@type": "Country", name: "United States" },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Content Production Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Videography",
              description: "Professional video production including short-form and long-form content for brands in Nashville.",
              url: "https://thefullcollection.com/services/videography",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Photography",
              description: "Brand and content photography for Nashville businesses.",
              url: "https://thefullcollection.com/services/photography",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Video Editing",
              description: "Post-production and video editing services.",
              url: "https://thefullcollection.com/services/editing",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Social Media Management",
              description: "Full-service social media management for brands in Nashville, TN.",
              url: "https://thefullcollection.com/services/social-media-management",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Content Strategy",
              description: "Data-driven content strategy for growing brands.",
              url: "https://thefullcollection.com/services/content-strategy",
            },
          },
        ],
      },
      priceRange: "$$",
      knowsAbout: [
        "Content Production",
        "Video Production",
        "Social Media Marketing",
        "Photography",
        "Content Strategy",
        "Short-Form Video",
        "TikTok Marketing",
        "Instagram Reels",
        "YouTube Production",
        "Brand Content",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://thefullcollection.com/#website",
      url: "https://thefullcollection.com",
      name: "The Full Collection",
      description: "Nashville Content Production Agency",
      publisher: { "@id": "https://thefullcollection.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://thefullcollection.com/?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Marquee />
      <VSL />
      <Services />
      <Portal />
      <Work />
      <Pricing />
      <Process />
      <About />
      <Team />
      <Locations />
      <Contact />
    </>
  );
}
