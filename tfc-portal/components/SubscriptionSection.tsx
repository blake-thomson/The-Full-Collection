"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TIERS, TierKey } from "@/lib/tiers";

interface SubscriptionData {
  tier: TierKey | null;
  status: string;
  planName?: string | null;
  priceAmount?: number | null;
  priceInterval?: string | null;
  currentPeriodEnd?: number;
  currentPeriodStart?: number;
  startDate?: number;
  totalPaid?: number;
  totalPaymentCount?: number;
  daysOverdue?: number | null;
  cancelAtPeriodEnd?: boolean;
  subscription?: null;
}

interface Props {
  clientId?: string;
  isTeam?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  active: {
    label: "Active",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
  },
  past_due: {
    label: "Past Due",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.25)",
  },
  canceled: {
    label: "Canceled",
    color: "#6B7280",
    bg: "rgba(107,114,128,0.12)",
    border: "rgba(107,114,128,0.25)",
  },
  trialing: {
    label: "Trial",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.25)",
  },
  unpaid: {
    label: "Unpaid",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
  },
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

const formatDate = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export function SubscriptionSection({ clientId, isTeam }: Props) {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const url = clientId && isTeam
        ? `/api/subscription?client_id=${clientId}`
        : "/api/subscription";
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setApiError(json?.error || `Error ${res.status}`);
      }
    } catch (err) {
      setApiError("Network error — please refresh.");
    }
    setLoading(false);
  }, [clientId, isTeam]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-text-3 text-[13px]">Loading billing info...</span>
      </div>
    );
  }

  if (apiError || !data) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A49C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <h3 className="text-text font-heading text-[15px] font-bold m-0">Billing</h3>
        </div>
        <div className="px-5 py-6">
          <div className="text-center mb-4">
            <p className="text-text-3 text-[13px] m-0">No billing info found for this client.</p>
            {apiError && (
              <p className="text-[#EF4444] text-[11px] mt-1 m-0 font-mono">{apiError}</p>
            )}
          </div>
          {isTeam && clientId && <StripeLinkForm clientId={clientId} onLinked={load} />}
        </div>
      </div>
    );
  }

  const tier = data.tier && TIERS[data.tier] ? TIERS[data.tier] : null;
  // Stripe is the source of truth for plan name and price (works for standard tiers AND custom packages)
  const displayName = data.planName || (tier ? tier.name : data.tier ?? "—");
  const displayPrice = data.priceAmount ?? (tier ? tier.price * 100 : null); // normalize to cents
  const displayInterval = data.priceInterval || "month";
  const statusCfg =
    STATUS_CONFIG[data.status] || STATUS_CONFIG["active"];
  const isOverdue = data.status === "past_due";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A8A49C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
        <h3 className="text-text font-heading text-[15px] font-bold m-0">
          Billing
        </h3>
      </div>

      {/* Overdue Banner */}
      {isOverdue && (
        <div
          className="mx-5 mt-4 rounded-lg px-4 py-3 flex items-start gap-3 shrink-0"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="text-[#EF4444] text-[13px] font-semibold m-0">
              Payment overdue
              {data.daysOverdue != null && data.daysOverdue > 0
                ? ` — ${data.daysOverdue} day${data.daysOverdue !== 1 ? "s" : ""} past due`
                : ""}
            </p>
            <p className="text-[#EF4444] text-[11px] m-0 mt-0.5 opacity-80">
              Please update your payment method to avoid service interruption.
            </p>
          </div>
        </div>
      )}

      {/* Plan Card */}
      <div className="px-5 py-4 shrink-0">
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Plan name + status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase m-0 mb-1">
                Current Plan
              </p>
              <h4 className="text-text font-heading text-[22px] font-[800] m-0 leading-none">
                {displayName}
              </h4>
            </div>
            <span
              className="text-[10px] font-bold tracking-[0.06em] uppercase py-[4px] px-[10px] rounded-md shrink-0 mt-1"
              style={{
                background: statusCfg.bg,
                color: statusCfg.color,
                border: `1px solid ${statusCfg.border}`,
              }}
            >
              {statusCfg.label}
            </span>
          </div>

          {/* Stats grid — 5 data points */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Rate */}
            <div className="bg-surface rounded-lg p-3">
              <p className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase m-0 mb-1">
                {displayInterval === "year" ? "Yearly Rate" : displayInterval === "week" ? "Weekly Rate" : "Monthly Rate"}
              </p>
              <p className="text-text font-heading text-[20px] font-[800] m-0">
                {displayPrice != null
                  ? formatCurrency(displayPrice)
                  : "—"}
              </p>
            </div>

            {/* Next Payment */}
            <div className="bg-surface rounded-lg p-3">
              <p className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase m-0 mb-1">
                {data.cancelAtPeriodEnd ? "Ends On" : isOverdue ? "Was Due" : "Next Payment"}
              </p>
              <p
                className="font-heading text-[13px] font-[700] m-0 leading-tight"
                style={{ color: isOverdue ? "#EF4444" : "var(--color-text)" }}
              >
                {data.currentPeriodEnd ? formatDate(data.currentPeriodEnd) : "—"}
              </p>
              {isOverdue && data.daysOverdue != null && data.daysOverdue > 0 && (
                <p className="text-[#EF4444] text-[11px] font-semibold m-0 mt-0.5">
                  {data.daysOverdue}d overdue
                </p>
              )}
            </div>

            {/* Total Paid */}
            <div className="bg-surface rounded-lg p-3">
              <p className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase m-0 mb-1">
                Total Paid
              </p>
              <p className="text-[#10B981] font-heading text-[20px] font-[800] m-0">
                {data.totalPaid != null ? formatCurrency(data.totalPaid) : "—"}
              </p>
            </div>

            {/* Subscribed Since */}
            <div className="bg-surface rounded-lg p-3">
              <p className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase m-0 mb-1">
                Subscribed Since
              </p>
              <p className="text-text font-heading text-[13px] font-[700] m-0 leading-tight">
                {data.startDate ? formatDate(data.startDate) : "—"}
              </p>
            </div>

            {/* Payments Made */}
            <div className="bg-surface rounded-lg p-3 col-span-1">
              <p className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase m-0 mb-1">
                Payments Made
              </p>
              <p className="text-text font-heading text-[20px] font-[800] m-0">
                {data.totalPaymentCount != null ? data.totalPaymentCount : "—"}
              </p>
            </div>
          </div>

          {/* Cancel notice */}
          {data.cancelAtPeriodEnd && (
            <p className="text-text-3 text-[11px] mt-3 m-0">
              Your subscription will not renew after the period ends.
            </p>
          )}

          {/* Manage Billing / Update Payment */}
          {!isTeam && data.status && data.status !== "canceled" && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/stripe/portal", { method: "POST" });
                  if (res.ok) {
                    const { url } = await res.json();
                    window.open(url, "_blank");
                  }
                } catch {}
              }}
              className="mt-4 w-full py-2.5 px-4 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors"
              style={{
                background: "var(--color-surface-3)",
                border: "1px solid var(--color-border-2)",
                color: "var(--color-text-2)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-2)"; }}
            >
              Manage Billing & Payment Method
            </button>
          )}
        </div>
      </div>

      {/* No subscription fallback — with Stripe linking for team */}
      {!displayPrice && !data.currentPeriodEnd && (
        <div className="px-5 py-6">
          <div className="text-center mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto mb-2 text-text-3 opacity-30"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <p className="text-text-3 text-[13px] m-0">No active subscription.</p>
          </div>
          {isTeam && clientId && <StripeLinkForm clientId={clientId} onLinked={load} />}
        </div>
      )}
    </div>
  );
}

/* ── Team-only form to manually link a Stripe customer ── */
function StripeLinkForm({ clientId, onLinked }: { clientId: string; onLinked: () => void }) {
  const [stripeId, setStripeId] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLink = async () => {
    const trimmed = stripeId.trim();
    if (!trimmed) return;
    setLinking(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/stripe-link`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeCustomerId: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to link");
      } else {
        setSuccess(
          json.subscriptionId
            ? `Linked — subscription ${json.subscriptionStatus}`
            : "Linked customer (no subscription found)"
        );
        setStripeId("");
        setTimeout(() => onLinked(), 1200);
      }
    } catch {
      setError("Network error");
    }
    setLinking(false);
  };

  return (
    <div
      className="rounded-xl p-5 mt-2"
      style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
    >
      <p className="text-text-2 text-[13px] font-semibold m-0 mb-1">Link Stripe Customer</p>
      <p className="text-text-3 text-[11px] m-0 mb-3">
        Paste the Stripe customer ID (cus_...) to connect this client's billing.
      </p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={stripeId}
          onChange={(e) => setStripeId(e.target.value)}
          placeholder="cus_..."
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[13px] font-mono outline-none"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleLink()}
        />
        <button
          onClick={handleLink}
          disabled={linking || !stripeId.trim()}
          className="rounded-lg px-4 py-2 text-[12px] font-semibold cursor-pointer transition-opacity shrink-0"
          style={{
            background: "#635BFF",
            color: "#fff",
            border: "none",
            opacity: linking || !stripeId.trim() ? 0.5 : 1,
          }}
        >
          {linking ? "Linking..." : "Link"}
        </button>
      </div>
      {error && <p className="text-[#EF4444] text-[11px] mt-2 m-0">{error}</p>}
      {success && <p className="text-[#10B981] text-[11px] mt-2 m-0">{success}</p>}
    </div>
  );
}
