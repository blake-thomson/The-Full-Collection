"use client";

import { useState, useCallback } from "react";
import { Logo } from "@/components/ui/Logo";
import { STEP_TITLES, FORMATS, EMPTY_ONBOARDING_DATA, type OnboardingData } from "@/lib/constants";

interface Props {
  onComplete: (data: OnboardingData) => Promise<void>;
}

export function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ ...EMPTY_ONBOARDING_DATA });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const set = useCallback((k: string, v: any) => setData((prev) => ({ ...prev, [k]: v })), []);
  const setArr = useCallback(
    (k: string, i: number, v: string) =>
      setData((prev) => {
        const a = [...(prev as any)[k]];
        a[i] = v;
        return { ...prev, [k]: a };
      }),
    []
  );
  const clearErr = useCallback((k: string) => setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; }), []);

  const validateStep = () => {
    const e: Record<string, boolean> = {};
    if (step === 0) { if (!data.whoIHelp.trim()) e.whoIHelp = true; if (!data.helpAchieve.trim()) e.helpAchieve = true; if (!data.byDoing.trim()) e.byDoing = true; if (!data.soTheyCan.trim()) e.soTheyCan = true; }
    if (step === 1) { if (!data.primaryAudience.trim()) e.primaryAudience = true; if (!data.notMyAudience.trim()) e.notMyAudience = true; if (!data.problems.some((p: string) => p.trim())) e.problems = true; if (!data.desires.some((d: string) => d.trim())) e.desires = true; }
    if (step === 2) { if (data.pillars.filter((p: string) => p.trim()).length < 3) e.pillars = true; }
    if (step === 3) { if (!data.delivery) e.delivery = true; if (!data.swears) e.swears = true; if (!data.noGoTopics.trim()) e.noGoTopics = true; }
    if (step === 4) { if (!data.formats.length) e.formats = true; if (!data.lengthRange.trim()) e.lengthRange = true; if (!data.hookStyle.trim()) e.hookStyle = true; if (!data.captionStyle.trim()) e.captionStyle = true; }
    if (step === 5) { if (!data.references.some((r) => r.link.trim())) e.references = true; }
    if (step === 6) { if (!data.website.trim()) e.website = true; }
    if (step === 7) { if (!data.offerName.trim()) e.offerName = true; if (!data.pricePoint.trim()) e.pricePoint = true; if (!data.whoItsFor.trim()) e.whoItsFor = true; if (!data.callToAction.trim()) e.callToAction = true; }
    return e;
  };

  const advance = async () => {
    const e = validateStep();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < 7) { setStep((s) => s + 1); }
    else { setSaving(true); try { await onComplete(data); } catch (err) { console.error("Onboarding save failed:", err); setSaving(false); } }
  };

  const Pill = ({ options, field, active, onChange }: { options: string[]; field: string; active: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} className={`tfc-pill${active === o ? " active" : ""}`} onClick={() => { onChange(o); clearErr(field); }}>
          {o}
        </button>
      ))}
    </div>
  );

  const Req = ({ field }: { field: string }) =>
    errors[field] ? <span className="text-[#EF4444] text-[11px] ml-1.5 font-normal tracking-normal normal-case">Required</span> : null;

  const pct = Math.round(((step + 1) / 8) * 100);

  const steps = [
    /* Step 1: Positioning */
    <div key="s1">
      <p className="text-text-2 text-sm leading-relaxed m-0 mb-4">Complete your positioning sentence — this anchors every piece of content we create for you.</p>
      <div className="bg-surface-3 border border-border-2 rounded-[10px] p-[12px_16px] mb-6">
        <p className="text-text-2 text-sm m-0 leading-relaxed">
          Template: &quot;I help <strong className="text-text">[AUDIENCE]</strong> <strong className="text-text">[RESULT]</strong> by <strong className="text-text">[MECHANISM]</strong> so they can <strong className="text-text">[END STATE]</strong>.&quot;
        </p>
      </div>
      {([
        { k: "whoIHelp", l: "Who I help", ph: "e.g. Early-stage founders, agency owners..." },
        { k: "helpAchieve", l: "I help them achieve", ph: "e.g. Consistent deal flow and inbound leads..." },
        { k: "byDoing", l: "By doing this", ph: "e.g. Building a strategic personal brand on social..." },
        { k: "soTheyCan", l: "So they can", ph: "e.g. Scale without relying on cold outreach..." },
      ] as const).map(({ k, l, ph }) => (
        <div key={k} className="mb-[18px]">
          <label className="tfc-label">{l} <Req field={k} /></label>
          <input className={`tfc-input${errors[k] ? " error" : ""}`} value={(data as any)[k]} onChange={(e) => { set(k, e.target.value); clearErr(k); }} placeholder={ph} />
        </div>
      ))}
    </div>,

    /* Step 2: Audience */
    <div key="s2">
      <p className="text-text-2 text-sm mb-5 leading-relaxed">Specificity here is everything — the more precise you are, the sharper your content gets.</p>
      <div className="mb-[18px]">
        <label className="tfc-label">Primary Audience <Req field="primaryAudience" /></label>
        <textarea className={`tfc-textarea${errors.primaryAudience ? " error" : ""}`} value={data.primaryAudience} onChange={(e) => { set("primaryAudience", e.target.value); clearErr("primaryAudience"); }} placeholder="Job/business type, income level, where they hang out..." />
      </div>
      <div className="mb-[18px]">
        <label className="tfc-label">Not My Audience <Req field="notMyAudience" /></label>
        <input className={`tfc-input${errors.notMyAudience ? " error" : ""}`} value={data.notMyAudience} onChange={(e) => { set("notMyAudience", e.target.value); clearErr("notMyAudience"); }} placeholder="Who we should avoid attracting..." />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="tfc-label mb-3">Top 5 Problems <Req field="problems" /></label>
          {data.problems.map((p, i) => <input key={i} className="tfc-input mb-2" value={p} onChange={(e) => { setArr("problems", i, e.target.value); clearErr("problems"); }} placeholder={`Problem ${i + 1}`} />)}
        </div>
        <div>
          <label className="tfc-label mb-3">Top 5 Desires <Req field="desires" /></label>
          {data.desires.map((d, i) => <input key={i} className="tfc-input mb-2" value={d} onChange={(e) => { setArr("desires", i, e.target.value); clearErr("desires"); }} placeholder={`Desire ${i + 1}`} />)}
        </div>
      </div>
    </div>,

    /* Step 3: Pillars */
    <div key="s3">
      <p className="text-text-2 text-sm mb-4 leading-relaxed">List 3–5 repeatable themes that will anchor your content calendar week over week.</p>
      <div className="bg-surface-3 border border-border-2 rounded-[10px] p-[12px_16px] mb-[22px]">
        <p className="text-text-2 text-sm m-0 leading-relaxed">
          Cover: <strong className="text-text">Mass reach</strong> (broad pain points) · <strong className="text-text">Authority</strong> (your expertise) · <strong className="text-text">Aspirational</strong> (lifestyle/outcome)
        </p>
      </div>
      {errors.pillars && <div className="text-[#EF4444] text-xs mb-3.5">Please fill in at least 3 pillars.</div>}
      {data.pillars.map((p, i) => (
        <div key={i} className="mb-3.5">
          <label className="tfc-label">Pillar {i + 1}{i < 3 ? " *" : " (optional)"}</label>
          <input className="tfc-input" value={p} onChange={(e) => { setArr("pillars", i, e.target.value); clearErr("pillars"); }} placeholder="e.g. Scaling a service business without burning out..." />
        </div>
      ))}
    </div>,

    /* Step 4: Tone */
    <div key="s4">
      <div className="mb-[22px]">
        <label className="tfc-label">Delivery Style <Req field="delivery" /></label>
        <Pill field="delivery" options={["Calm & authoritative", "High energy & punchy", "Conversational", "Comedic"]} active={data.delivery} onChange={(v) => set("delivery", v)} />
      </div>
      <div className="mb-[22px]">
        <label className="tfc-label">Do You Swear on Camera? <Req field="swears" /></label>
        <Pill field="swears" options={["Yes", "No", "Sometimes"]} active={data.swears} onChange={(v) => set("swears", v)} />
      </div>
      <div className="mb-[18px]">
        <label className="tfc-label">No-Go Topics <Req field="noGoTopics" /></label>
        <input className={`tfc-input${errors.noGoTopics ? " error" : ""}`} value={data.noGoTopics} onChange={(e) => { set("noGoTopics", e.target.value); clearErr("noGoTopics"); }} placeholder="Topics, people, or subjects you never want covered..." />
      </div>
      <div>
        <label className="tfc-label mb-3">Your Strong Opinions / Hot Takes</label>
        {data.hotTakes.map((h, i) => <input key={i} className="tfc-input mb-2" value={h} onChange={(e) => setArr("hotTakes", i, e.target.value)} placeholder={`Hot take ${i + 1}...`} />)}
      </div>
    </div>,

    /* Step 5: Formats */
    <div key="s5">
      <div className="mb-6">
        <label className="tfc-label mb-3.5">Select All Formats You Want <Req field="formats" /></label>
        {FORMATS.map((f) => (
          <label key={f} className="flex items-center gap-3 mb-[11px] cursor-pointer">
            <input type="checkbox" checked={data.formats.includes(f)} onChange={(e) => { set("formats", e.target.checked ? [...data.formats, f] : data.formats.filter((x: string) => x !== f)); clearErr("formats"); }} className="accent-red w-[15px] h-[15px] shrink-0" />
            <span className="text-text text-sm">{f}</span>
          </label>
        ))}
      </div>
      {([
        { k: "lengthRange", l: "Length Range", ph: "e.g. 30–60 sec for Reels, 10–15 min for YouTube" },
        { k: "hookStyle", l: "Hook Style", ph: "e.g. Bold statement, controversial take, open loop..." },
        { k: "captionStyle", l: "Caption Style", ph: "e.g. Short & punchy, storytelling, educational..." },
      ] as const).map(({ k, l, ph }) => (
        <div key={k} className="mb-4">
          <label className="tfc-label">{l} <Req field={k} /></label>
          <input className={`tfc-input${errors[k] ? " error" : ""}`} value={(data as any)[k]} onChange={(e) => { set(k, e.target.value); clearErr(k); }} placeholder={ph} />
        </div>
      ))}
    </div>,

    /* Step 6: References */
    <div key="s6">
      <p className="text-text-2 text-sm mb-5 leading-relaxed">Provide 6–12 links to posts or videos that match what you want.</p>
      {errors.references && <div className="text-[#EF4444] text-xs mb-3">Please add at least one reference link.</div>}
      {data.references.map((ref, i) => (
        <div key={i} className="bg-surface-2 border border-border rounded-xl p-[18px] mb-3">
          <div className="flex justify-between mb-3">
            <span className="text-red text-[11px] font-bold tracking-[0.1em] uppercase">Reference {i + 1}</span>
            {i > 0 && <button onClick={() => set("references", data.references.filter((_: any, j: number) => j !== i))} className="text-[#EF4444] bg-transparent border-none cursor-pointer text-xs font-body">Remove</button>}
          </div>
          <div className="flex flex-col gap-2">
            <input className="tfc-input" value={ref.link} onChange={(e) => { const r = [...data.references]; r[i] = { ...r[i], link: e.target.value }; set("references", r); clearErr("references"); }} placeholder="Paste link here..." />
            <input className="tfc-input" value={ref.likes} onChange={(e) => { const r = [...data.references]; r[i] = { ...r[i], likes: e.target.value }; set("references", r); }} placeholder="What you like about it..." />
            <input className="tfc-input" value={ref.copyVsAvoid} onChange={(e) => { const r = [...data.references]; r[i] = { ...r[i], copyVsAvoid: e.target.value }; set("references", r); }} placeholder="What to copy vs. what to avoid..." />
          </div>
        </div>
      ))}
      {data.references.length < 12 && <button className="tfc-btn-ghost w-full text-[13px]" onClick={() => set("references", [...data.references, { link: "", likes: "", copyVsAvoid: "" }])}>+ Add Another Reference</button>}
    </div>,

    /* Step 7: Brand Assets */
    <div key="s7">
      <p className="text-text-2 text-sm mb-5 leading-relaxed">Upload or link assets so we can maintain consistency across all content.</p>
      {([
        { k: "logoFiles", l: "Logo Files", ph: "Link to logo files..." },
        { k: "brandColors", l: "Brand Colors", ph: "e.g. #E02020, #0A0A0A" },
        { k: "fonts", l: "Fonts", ph: "e.g. Syne Bold, DM Sans Regular" },
        { k: "website", l: "Website", ph: "https://yoursite.com", req: true },
        { k: "instagram", l: "Instagram", ph: "@yourhandle" },
        { k: "tiktok", l: "TikTok", ph: "@yourhandle" },
        { k: "youtube", l: "YouTube", ph: "Channel link or @handle" },
        { k: "linkedin", l: "LinkedIn", ph: "linkedin.com/in/yourprofile" },
        { k: "brandGuidelines", l: "Brand Guidelines", ph: "Link to brand guidelines..." },
        { k: "pastContent", l: "Past Content", ph: "Link to past longform or shortform..." },
      ] as const).map(({ k, l, ph, ...rest }) => (
        <div key={k} className="mb-3.5">
          <label className="tfc-label">{l}{"req" in rest && <Req field={k} />}</label>
          <input className={`tfc-input${errors[k] ? " error" : ""}`} value={(data as any)[k]} onChange={(e) => { set(k, e.target.value); clearErr(k); }} placeholder={ph} />
        </div>
      ))}
    </div>,

    /* Step 8: Offer */
    <div key="s8">
      <p className="text-text-2 text-sm mb-5 leading-relaxed">This ties your content to a clear north star — every piece of content should point here.</p>
      {([
        { k: "offerName", l: "Offer Name", ph: "e.g. 1:1 Coaching, The Agency Blueprint..." },
        { k: "pricePoint", l: "Price Point", ph: "e.g. $5,000 / month" },
        { k: "whoItsFor", l: "Who It's For", ph: "Describe the ideal client..." },
        { k: "callToAction", l: "Call to Action", ph: 'e.g. DM me "READY", Book a call at...' },
      ] as const).map(({ k, l, ph }) => (
        <div key={k} className="mb-[18px]">
          <label className="tfc-label">{l} <Req field={k} /></label>
          <input className={`tfc-input${errors[k] ? " error" : ""}`} value={(data as any)[k]} onChange={(e) => { set(k, e.target.value); clearErr(k); }} placeholder={ph} />
        </div>
      ))}
    </div>,
  ];

  return (
    <div className="bg-bg min-h-screen">
      <div className="border-b border-border px-7 h-[58px] flex items-center justify-between">
        <Logo size={13} />
        <span className="text-text-3 text-xs tracking-[0.06em]">ONBOARDING · STEP {step + 1} OF 8</span>
      </div>
      <div className="h-0.5 bg-border">
        <div className="h-full bg-gradient-to-r from-red to-red-light transition-all duration-400" style={{ width: `${pct}%` }} />
      </div>
      <div className="max-w-[700px] mx-auto px-6 pt-12 pb-20">
        <div className="mb-8">
          <div className="flex gap-1.5 mb-3.5">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-[3px] flex-1 rounded-sm transition-colors duration-300" style={{ background: i <= step ? "var(--color-red)" : "#2E2E2E" }} />
            ))}
          </div>
          <div className="text-red text-[11px] font-bold tracking-[0.14em] uppercase mb-2">Step {step + 1} of 8</div>
          <h1 className="text-text font-heading text-[26px] font-[800] m-0 leading-tight">{STEP_TITLES[step]}</h1>
        </div>
        {Object.keys(errors).length > 0 && (
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg py-2.5 px-3.5 mb-6">
            <span className="text-[#FCA5A5] text-[13px]">Please fill in all required fields before continuing.</span>
          </div>
        )}
        <div>{steps[step]}</div>
        <div className="flex justify-between mt-9 pt-6 border-t border-border">
          <button className="tfc-btn-ghost" onClick={() => { setErrors({}); step > 0 && setStep((s) => s - 1); }} disabled={step === 0}>← Back</button>
          <button className="tfc-btn" onClick={advance} disabled={saving}>
            {step < 7 ? "Continue →" : saving ? "Saving..." : "Complete Onboarding →"}
          </button>
        </div>
      </div>
    </div>
  );
}
