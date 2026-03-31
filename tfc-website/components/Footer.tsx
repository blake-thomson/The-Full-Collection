"use client";

import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Locations", href: "#locations" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Videography", href: "/services/videography" },
      { label: "Photography", href: "/services/photography" },
      { label: "Editing", href: "/services/editing" },
      { label: "Social Media", href: "/services/social-media-management" },
      { label: "Strategy", href: "/services/content-strategy" },
      { label: "Client Portal", href: "/services/client-portal" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Client Portal", href: "#portal" },
      { label: "Work", href: "#work" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-warm-900 text-white">
      <div className="container-wide section-tight">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div
              className="font-heading font-[800] tracking-[0.28em] uppercase text-[14px] mb-4"
              style={{ color: "#E02020" }}
            >
              THE FULL COLLECTION
            </div>
            <p className="text-warm-500 text-sm leading-relaxed max-w-sm">
              Full-stack content production for creators and brands.
              Videography, editing, photography, social media management,
              and a proprietary client portal to track it all.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-warm-600 mb-4">
                {col.title}
              </div>
              <div className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm text-warm-400 hover:text-white transition-colors no-underline"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-warm-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-warm-600 text-xs">
            &copy; {new Date().getFullYear()} The Full Collection. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-warm-600 text-xs tracking-wide">Powered by</span>
              <Image src="/status10-logo.png" alt="STATUS10" width={80} height={20} className="opacity-60 hover:opacity-100 transition-opacity duration-200" />
            </div>
            <Link href="/terms" className="text-warm-600 hover:text-warm-400 text-xs no-underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-warm-600 hover:text-warm-400 text-xs no-underline">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
