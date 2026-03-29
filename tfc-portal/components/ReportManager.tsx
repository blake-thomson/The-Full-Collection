"use client";

import { useState, useEffect, useCallback } from "react";

interface Report {
  id: string;
  client_id: string;
  month: string;
  generated_at: string;
  pdf_storage_path: string | null;
  sent_at: string | null;
  sent_to: string | null;
  metrics_snapshot: {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    summary: string;
  } | null;
  previewUrl: string | null;
}

interface Props {
  clientId: string;
}

function getLastNMonths(n: number) {
  const months: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    months.push({ label, value });
  }
  return months;
}

export function ReportManager({ clientId }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const months = getLastNMonths(12);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/list/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerate = async (month: string) => {
    setShowPicker(false);
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, month }),
      });
      if (res.ok) {
        showToast("Report generated successfully");
        await fetchReports();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to generate report");
      }
    } catch {
      showToast("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (reportId: string) => {
    setSendingId(reportId);
    try {
      const res = await fetch(`/api/reports/send/${reportId}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Report sent to ${data.sentTo}`);
        await fetchReports();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to send report");
      }
    } catch {
      showToast("Failed to send report");
    } finally {
      setSendingId(null);
    }
  };

  const formatMonth = (month: string) => {
    const d = new Date(month);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Monthly Reports</h2>
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            disabled={generating}
            className="px-4 py-2 bg-[#E02020] text-white text-sm font-semibold rounded-lg hover:bg-[#C01818] transition disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Report"
            )}
          </button>

          {showPicker && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl z-50 py-2 max-h-80 overflow-y-auto">
              {months.map((m) => {
                const exists = reports.some((r) => r.month === m.value);
                return (
                  <button
                    key={m.value}
                    onClick={() => handleGenerate(m.value)}
                    className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-surface-2 transition flex items-center justify-between"
                  >
                    <span>{m.label}</span>
                    {exists && (
                      <span className="text-[10px] text-text-3 bg-surface-2 px-2 py-0.5 rounded">
                        Regenerate
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface border border-border rounded-xl px-5 py-3 shadow-xl text-sm text-text animate-fade-in">
          {toast}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-text-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-40">
            <svg className="w-12 h-12 mx-auto text-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-text-3 text-sm">No reports generated yet</p>
          <p className="text-text-3 text-xs mt-1">Click "Generate Report" to create your first monthly report</p>
        </div>
      )}

      {/* Report Cards */}
      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-surface border border-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-text">
                    {formatMonth(report.month)}
                  </h3>
                  {report.sent_at ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-[#10B981]/12 border border-[#10B981]/30 text-[#10B981]">
                      Sent
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-[#F59E0B]/12 border border-[#F59E0B]/30 text-[#F59E0B]">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-3">
                  Generated {formatDate(report.generated_at)}
                </p>
                {report.sent_at && (
                  <p className="text-xs text-text-3 mt-0.5">
                    Sent to {report.sent_to} on {formatDate(report.sent_at)}
                  </p>
                )}
                {report.metrics_snapshot && (
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-text-3">
                      {report.metrics_snapshot.totalPosts} posts
                    </span>
                    <span className="text-xs text-text-3">
                      {report.metrics_snapshot.totalViews.toLocaleString()} views
                    </span>
                    <span className="text-xs text-text-3">
                      {report.metrics_snapshot.totalLikes.toLocaleString()} likes
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {report.previewUrl && (
                  <a
                    href={report.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-medium text-text bg-surface-2 border border-border rounded-lg hover:bg-bg transition"
                  >
                    Preview
                  </a>
                )}
                <button
                  onClick={() => handleSend(report.id)}
                  disabled={sendingId === report.id}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#E02020] rounded-lg hover:bg-[#C01818] transition disabled:opacity-50"
                >
                  {sendingId === report.id ? "Sending..." : report.sent_at ? "Resend" : "Send to Client"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
