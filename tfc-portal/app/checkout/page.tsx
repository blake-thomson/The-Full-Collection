"use client";

import { useState } from "react";
import { TIERS, TierKey } from "@/lib/tiers";

export default function CheckoutPage() {
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", line1: "", city: "", state: "", zip: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!selectedTier) { setError("Please select a package."); return; }
    if (!form.name || !form.email || !form.phone || !form.line1 || !form.city || !form.state || !form.zip) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: { line1: form.line1, city: form.city, state: form.state, zip: form.zip },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <div className="text-center pt-16 pb-10 px-4">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">
          The Full <span className="text-red">Collection</span>
        </h1>
        <p className="text-text-2 text-lg max-w-xl mx-auto">
          Premium content production for creators who are serious about growth.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {(Object.keys(TIERS) as TierKey[]).map((key) => {
          const tier = TIERS[key];
          const active = selectedTier === key;
          const popular = "popular" in tier && tier.popular;
          return (
            <button
              key={key}
              onClick={() => setSelectedTier(key)}
              className={`relative text-left p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                active
                  ? "border-red bg-red/5"
                  : popular
                  ? "border-border-2 bg-surface"
                  : "border-border bg-surface"
              } hover:border-red/60`}
            >
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full bg-red text-white">
                  Most Popular
                </span>
              )}
              <h3 className="font-heading text-xl font-bold mb-1">{tier.name}</h3>
              <p className="text-text-3 text-sm mb-4">{tier.description}</p>
              <div className="mb-5">
                <span className="text-3xl font-heading font-bold">${tier.price.toLocaleString()}</span>
                <span className="text-text-3 text-sm">/mo</span>
              </div>
              <ul className="space-y-2">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-2">
                    <span className="text-red mt-0.5 shrink-0">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              {active && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-red flex items-center justify-center">
                  <span className="text-white text-xs">&#10003;</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Contact Form */}
      <div className="max-w-lg mx-auto px-4 pb-20">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-heading text-xl font-bold mb-1">Your Information</h2>
          <p className="text-text-3 text-sm mb-6">
            Fill in your details below and we&apos;ll get you set up.
          </p>

          <div className="space-y-4">
            <div>
              <label className="tfc-label">Full Name</label>
              <input className="tfc-input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" />
            </div>
            <div>
              <label className="tfc-label">Email</label>
              <input type="email" className="tfc-input w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div>
              <label className="tfc-label">Phone Number</label>
              <input type="tel" className="tfc-input w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
            </div>

            <div className="border-t border-border pt-4">
              <label className="tfc-label">Address</label>
              <input className="tfc-input w-full mb-3" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="Street address" />
              <div className="grid grid-cols-3 gap-3">
                <input className="tfc-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
                <input className="tfc-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" />
                <input className="tfc-input" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} placeholder="Zip" />
              </div>
            </div>
          </div>

          {error && <p className="text-red text-sm mt-4">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={loading || !selectedTier}
            className="tfc-btn w-full mt-6 py-3.5 text-base disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecting to payment...
              </span>
            ) : selectedTier ? (
              `Continue to Payment — $${TIERS[selectedTier].price.toLocaleString()}/mo`
            ) : (
              "Select a package above"
            )}
          </button>

          <p className="text-text-3 text-[11px] text-center mt-3">
            Secure payment via Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
