"use client";

import { useState, useEffect, useCallback } from "react";

interface SocialAccount {
  id: string;
  client_id: string;
  platform: string;
  account_name: string | null;
  platform_user_id: string | null;
  connected: boolean;
  connected_at: string;
}

interface Props {
  clientId: string;
}

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.16V11.7a4.83 4.83 0 01-3.77-1.24V6.69h3.77z" />
      </svg>
    ),
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

export default function SocialAccounts({ clientId }: Props) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/social-accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDisconnect = async (accountId: string) => {
    setDisconnecting(accountId);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/social-accounts?id=${accountId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      }
    } catch {
      // silent
    } finally {
      setDisconnecting(null);
    }
  };

  const getAccount = (platformId: string) =>
    accounts.find((a) => a.platform === platformId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface rounded-xl border border-border p-5 animate-pulse h-[120px]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PLATFORMS.map((platform) => {
        const account = getAccount(platform.id);
        const isConnected = !!account;

        return (
          <div
            key={platform.id}
            className="bg-surface rounded-xl border border-border p-5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: platform.color + "18",
                  color: platform.color,
                }}
              >
                {platform.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text text-[14px] font-semibold font-body">
                  {platform.name}
                </p>
                {isConnected && account.account_name && (
                  <p className="text-text-2 text-[12px] font-body truncate">
                    {account.account_name}
                  </p>
                )}
              </div>
              {isConnected ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-body shrink-0">
                  Connected
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-text-3 font-body shrink-0">
                  Not Connected
                </span>
              )}
            </div>

            {isConnected ? (
              <button
                onClick={() => handleDisconnect(account.id)}
                disabled={disconnecting === account.id}
                className="tfc-btn-ghost text-[12px] font-body w-full"
                style={{ padding: "7px 0" }}
              >
                {disconnecting === account.id
                  ? "Disconnecting..."
                  : "Disconnect"}
              </button>
            ) : (
              <a
                href={`/api/social/${platform.id}/connect?client_id=${clientId}`}
                className="tfc-btn text-[12px] font-body w-full text-center block"
                style={{ padding: "7px 0", textDecoration: "none" }}
              >
                Connect
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
