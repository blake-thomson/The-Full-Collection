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
  token_expiry: string | null;
}

interface Props {
  clientId: string;
}

const PLATFORMS = [
  {
    id: "instagram",
    name: "Meta",
    description: "Instagram & Facebook",
    color: "#0081FB",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Short-form video",
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
    description: "Long-form video",
    color: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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

  const getTokenStatus = (account: SocialAccount): "healthy" | "expiring" | "expired" => {
    // No expiry = permanent token (e.g. Meta Page token) — always healthy
    if (!account.token_expiry) return "healthy";
    const expiry = new Date(account.token_expiry);
    const now = new Date();
    if (expiry < now) return "expired";
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (expiry.getTime() - now.getTime() < threeDays) return "expiring";
    return "healthy";
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-surface rounded-xl border border-border p-5 animate-pulse h-[88px]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {PLATFORMS.map((platform) => {
        const account = getAccount(platform.id);
        const isConnected = !!account;

        return (
          <div
            key={platform.id}
            className="bg-surface rounded-xl border border-border p-4 sm:p-5 flex items-center gap-4"
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: platform.color + "14",
                color: platform.color,
              }}
            >
              {platform.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-text text-[14px] font-semibold font-body">
                  {platform.name}
                </p>
                {isConnected ? (
                  (() => {
                    const status = getTokenStatus(account);
                    if (status === "expired") {
                      return (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-body">
                          Expired
                        </span>
                      );
                    }
                    if (status === "expiring") {
                      return (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-body">
                          Expiring Soon
                        </span>
                      );
                    }
                    return (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-body">
                        Connected
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-text-3 font-body">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-text-3 text-[12px] font-body mt-0.5">
                {isConnected && account.account_name
                  ? account.account_name
                  : platform.description}
              </p>
            </div>

            {/* Action */}
            <div className="shrink-0">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  {getTokenStatus(account) === "expired" && (
                    <a
                      href={`/api/social/${platform.id}/connect?client_id=${clientId}`}
                      className="tfc-btn text-[12px] font-body text-center"
                      style={{ padding: "6px 14px", textDecoration: "none" }}
                    >
                      Reconnect
                    </a>
                  )}
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnecting === account.id}
                    className="tfc-btn-ghost text-[12px] font-body"
                    style={{ padding: "6px 14px" }}
                  >
                    {disconnecting === account.id
                      ? "..."
                      : "Disconnect"}
                  </button>
                </div>
              ) : (
                <a
                  href={`/api/social/${platform.id}/connect?client_id=${clientId}`}
                  className="tfc-btn text-[12px] font-body text-center"
                  style={{ padding: "6px 16px", textDecoration: "none" }}
                >
                  Connect
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
