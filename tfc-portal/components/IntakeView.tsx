"use client";

import type { OnboardingData } from "@/lib/constants";

interface Props {
  data: OnboardingData | null;
  title?: string;
  subtitle?: string;
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-[20px_22px] mb-3">
      <div className="text-red text-[10px] font-bold tracking-[0.16em] uppercase mb-3.5">{title}</div>
      {children}
    </div>
  );
}

function Row({ l, v }: { l: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="mb-2 flex gap-2.5">
      <span className="text-text-3 text-xs font-semibold tracking-[0.06em] uppercase shrink-0 min-w-[140px] pt-px">{l}</span>
      <span className="text-text text-[13px] leading-relaxed">{v}</span>
    </div>
  );
}

function List({ l, items }: { l: string; items?: string[] }) {
  const filtered = items?.filter(Boolean);
  if (!filtered?.length) return null;
  return (
    <div className="mb-2 flex gap-2.5">
      <span className="text-text-3 text-xs font-semibold tracking-[0.06em] uppercase shrink-0 min-w-[140px]">{l}</span>
      <ul className="m-0 pl-4">
        {filtered.map((x, i) => <li key={i} className="text-text text-[13px] mb-0.5 leading-normal">{x}</li>)}
      </ul>
    </div>
  );
}

export function IntakeView({ data: d, title, subtitle }: Props) {
  if (!d) {
    return (
      <div className="p-[60px_28px] text-center">
        <div className="text-text-3 text-[32px] mb-4">📋</div>
        <div className="text-text-2 text-[15px] font-medium">Onboarding not yet completed</div>
        <div className="text-text-3 text-[13px] mt-1.5">This client hasn&apos;t finished their intake form.</div>
      </div>
    );
  }

  return (
    <div className="p-[28px_24px] max-w-[800px] mx-auto">
      {title && <h2 className="text-text font-heading text-xl font-[800] mb-1">{title}</h2>}
      {subtitle && <p className="text-text-2 text-[13px] mb-6">{subtitle}</p>}
      <Sec title="Positioning">
        <Row l="Who They Help" v={d.whoIHelp} />
        <Row l="Help Them Achieve" v={d.helpAchieve} />
        <Row l="By Doing This" v={d.byDoing} />
        <Row l="So They Can" v={d.soTheyCan} />
      </Sec>
      <Sec title="Audience">
        <Row l="Primary Audience" v={d.primaryAudience} />
        <Row l="Not Their Audience" v={d.notMyAudience} />
        <List l="Top Problems" items={d.problems} />
        <List l="Top Desires" items={d.desires} />
      </Sec>
      <Sec title="Content Pillars"><List l="Pillars" items={d.pillars} /></Sec>
      <Sec title="Tone & POV">
        <Row l="Delivery Style" v={d.delivery} />
        <Row l="Swears on Camera" v={d.swears} />
        <Row l="No-Go Topics" v={d.noGoTopics} />
        <List l="Hot Takes" items={d.hotTakes} />
      </Sec>
      <Sec title="Content Formats">
        <List l="Formats" items={d.formats} />
        <Row l="Length Range" v={d.lengthRange} />
        <Row l="Hook Style" v={d.hookStyle} />
        <Row l="Caption Style" v={d.captionStyle} />
      </Sec>
      {d.references?.filter((r) => r.link).length > 0 && (
        <Sec title="Reference Content">
          {d.references.filter((r) => r.link).map((r, i) => (
            <div key={i} className="mb-3 pb-3 border-b border-border">
              <div className="text-red text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5">Ref {i + 1}</div>
              <Row l="Link" v={r.link} />
              <Row l="What They Like" v={r.likes} />
              <Row l="Copy vs Avoid" v={r.copyVsAvoid} />
            </div>
          ))}
        </Sec>
      )}
      <Sec title="Brand Assets">
        <Row l="Website" v={d.website} />
        <Row l="Instagram" v={d.instagram} />
        <Row l="TikTok" v={d.tiktok} />
        <Row l="YouTube" v={d.youtube} />
        <Row l="LinkedIn" v={d.linkedin} />
        <Row l="Brand Colors" v={d.brandColors} />
        <Row l="Fonts" v={d.fonts} />
      </Sec>
      <Sec title="Offer">
        <Row l="Offer Name" v={d.offerName} />
        <Row l="Price Point" v={d.pricePoint} />
        <Row l="Who It's For" v={d.whoItsFor} />
        <Row l="Call to Action" v={d.callToAction} />
      </Sec>
    </div>
  );
}
