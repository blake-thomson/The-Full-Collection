"use client";

import { useState, useEffect, useCallback } from "react";

interface Invoice {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  amount: number;
  status: "pending" | "sent" | "paid" | "overdue";
  due_date: string;
  created_at: string;
}

interface CurrentUser {
  name: string;
  email: string;
  type: "client" | "team";
}

interface Props {
  clientId: string;
  currentUser: CurrentUser;
  isTeam: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pending", color: "#6B7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)" },
  draft: { label: "Draft", color: "#6B7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)" },
  sent: { label: "Sent", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)" },
  paid: { label: "Paid", color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  overdue: { label: "Overdue", color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
};

export function InvoiceSection({ clientId, currentUser, isTeam }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", amount: "", due_date: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?client_id=${clientId}`);
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (err) {
      setError("Failed to load invoices.");
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = filter === "all"
    ? invoices
    : invoices.filter((inv) => inv.status === filter);

  const totalOwed = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "sent" || inv.status === "overdue")
    .reduce((acc, inv) => acc + inv.amount, 0);

  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + inv.amount, 0);

  const handleCreateInvoice = async () => {
    if (!formData.title.trim() || !formData.amount || !formData.due_date) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
        }),
      });
      if (res.ok) {
        const invoice = await res.json();
        setInvoices((prev) => [invoice, ...prev]);
        setFormData({ title: "", description: "", amount: "", due_date: "" });
        setShowForm(false);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to create invoice.");
      }
    } catch (err) {
      setError("Failed to create invoice.");
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: Invoice["status"]) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status } : inv));
      }
    } catch (err) {
      setError("Failed to update invoice status.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A49C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <h3 className="text-text font-heading text-[15px] font-bold m-0">Invoices</h3>
        </div>
        {isTeam && (
          <button
            className="tfc-btn shrink-0"
            style={{ padding: "8px 16px", fontSize: 12 }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ New Invoice"}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase mb-1">Total Invoices</div>
            <div className="text-text font-heading text-[20px] font-[800]">{invoices.length}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase mb-1">Outstanding</div>
            <div className="text-[#F59E0B] font-heading text-[20px] font-[800]">{formatCurrency(totalOwed)}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase mb-1">Total Paid</div>
            <div className="text-[#10B981] font-heading text-[20px] font-[800]">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase mb-1">Overdue</div>
            <div className="text-[#EF4444] font-heading text-[20px] font-[800]">
              {invoices.filter((inv) => inv.status === "overdue").length}
            </div>
          </div>
        </div>
      </div>

      {/* Create Invoice Form (Team only) */}
      {isTeam && showForm && (
        <div className="px-5 py-4 border-b border-border bg-surface-2 shrink-0">
          <h4 className="text-text font-heading text-[13px] font-bold m-0 mb-3">Create Invoice</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="sm:col-span-3">
              <label className="tfc-label">Title</label>
              <input
                className="tfc-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Invoice title..."
              />
            </div>
            <div className="sm:col-span-3">
              <label className="tfc-label">Description (optional)</label>
              <input
                className="tfc-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            <div>
              <label className="tfc-label">Amount (USD)</label>
              <input
                type="number"
                className="tfc-input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="tfc-label">Due Date</label>
              <input
                type="date"
                className="tfc-input"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div className="flex items-end">
              <button
                className="tfc-btn w-full"
                style={{ padding: "10px 16px", fontSize: 12 }}
                onClick={handleCreateInvoice}
                disabled={submitting || !formData.title.trim() || !formData.amount || !formData.due_date}
              >
                {submitting ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-5 py-2 shrink-0">
          <p className="text-[#EF4444] text-[12px] m-0">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="px-5 py-2.5 border-b border-border flex gap-1.5 overflow-x-auto shrink-0">
        {[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending" },
          { id: "sent", label: "Sent" },
          { id: "paid", label: "Paid" },
          { id: "overdue", label: "Overdue" },
        ].map((f) => (
          <button
            key={f.id}
            className={`tfc-pill${filter === f.id ? " active" : ""}`}
            style={{ padding: "6px 14px", fontSize: 12, whiteSpace: "nowrap" }}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="text-text-3 text-[13px] text-center py-10">Loading invoices...</div>
        )}
        {!loading && filteredInvoices.length === 0 && (
          <div className="text-text-3 text-[13px] text-center py-16">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-30">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            No invoices {filter !== "all" ? `with status "${filter}"` : "yet"}.
          </div>
        )}
        {!loading && filteredInvoices.map((inv) => {
          const cfg = STATUS_CONFIG[inv.status];
          return (
            <div
              key={inv.id}
              className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3 transition-colors hover:bg-surface-2"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <p className="text-text text-[14px] font-semibold m-0 truncate">{inv.title}</p>
                  <span
                    className="text-[10px] font-bold tracking-[0.06em] uppercase py-[3px] px-[8px] rounded-md shrink-0"
                    style={{
                      background: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-text-3 text-[11px]">
                  <span>Created {formatDate(inv.created_at)}</span>
                  <span>Due {formatDate(inv.due_date)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-text font-heading text-[20px] font-[800] shrink-0">
                {formatCurrency(inv.amount)}
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 shrink-0">
                {isTeam && inv.status === "pending" && (
                  <button
                    className="text-[11px] font-semibold py-1.5 px-3 rounded-md cursor-pointer font-body transition-colors bg-surface-3 border border-border text-text-2 hover:text-text hover:border-border-2"
                    onClick={() => updateStatus(inv.id, "sent")}
                  >
                    Send
                  </button>
                )}
                {isTeam && inv.status === "sent" && (
                  <button
                    className="text-[11px] font-semibold py-1.5 px-3 rounded-md cursor-pointer font-body transition-colors bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)] text-[#10B981] hover:bg-[rgba(16,185,129,0.15)]"
                    onClick={() => updateStatus(inv.id, "paid")}
                  >
                    Mark Paid
                  </button>
                )}
                {isTeam && inv.status === "sent" && (
                  <button
                    className="text-[11px] font-semibold py-1.5 px-3 rounded-md cursor-pointer font-body transition-colors bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.15)]"
                    onClick={() => updateStatus(inv.id, "overdue")}
                  >
                    Mark Overdue
                  </button>
                )}
                {!isTeam && (inv.status === "sent" || inv.status === "overdue") && (
                  <button
                    className="tfc-btn"
                    style={{ padding: "7px 16px", fontSize: 11 }}
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/invoices/pay", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ invoice_id: inv.id }),
                        });
                        if (res.ok) {
                          const { url } = await res.json();
                          if (url) window.location.href = url;
                        } else {
                          const data = await res.json();
                          setError(data.error || "Failed to initiate payment.");
                        }
                      } catch {
                        setError("Failed to initiate payment. Please try again.");
                      }
                    }}
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
