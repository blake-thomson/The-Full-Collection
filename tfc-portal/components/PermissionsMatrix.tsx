"use client";

import { useState, useEffect, useCallback } from "react";
import { ALL_PERMISSIONS, PERMISSION_LABELS } from "@/lib/use-permissions";

interface PermissionRow {
  id?: string;
  role: string;
  permission: string;
  granted: boolean;
}

interface Props {
  currentUserRole: string;
}

const ROLES = ["owner", "admin", "youtube_editor", "short_form_editor", "smm"];
const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  youtube_editor: "YT Editor",
  short_form_editor: "SF Editor",
  smm: "SMM",
};

export function PermissionsMatrix({ currentUserRole }: Props) {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Only show to owners
  if (currentUserRole !== "owner") {
    return null;
  }

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/permissions");
      if (res.ok) {
        const data: PermissionRow[] = await res.json();
        const map: Record<string, Record<string, boolean>> = {};
        for (const role of ROLES) {
          map[role] = {};
          for (const perm of ALL_PERMISSIONS) {
            map[role][perm] = role === "owner" ? true : false;
          }
        }
        for (const row of data) {
          if (map[row.role]) {
            map[row.role][row.permission] = row.granted;
          }
        }
        setPermissions(map);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleToggle = async (role: string, permission: string) => {
    if (role === "owner") return;
    const key = `${role}-${permission}`;
    setToggling(key);

    const currentValue = permissions[role]?.[permission] ?? false;
    const newValue = !currentValue;

    // Optimistic update
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [permission]: newValue },
    }));

    try {
      await fetch("/api/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permission, granted: newValue }),
      });
    } catch {
      // Revert on failure
      setPermissions((prev) => ({
        ...prev,
        [role]: { ...prev[role], [permission]: currentValue },
      }));
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">Role Permissions</h2>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 pr-4 text-text-2 font-medium min-w-[180px]">
                Permission
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className="text-center py-3 px-3 text-text-2 font-medium min-w-[80px]"
                >
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((perm) => (
              <tr key={perm} className="border-b border-border/50">
                <td className="py-2.5 pr-4 text-text">{PERMISSION_LABELS[perm]}</td>
                {ROLES.map((role) => {
                  const granted = permissions[role]?.[perm] ?? false;
                  const isOwner = role === "owner";
                  const key = `${role}-${perm}`;
                  const isToggling = toggling === key;

                  return (
                    <td key={role} className="text-center py-2.5 px-3">
                      <button
                        onClick={() => handleToggle(role, perm)}
                        disabled={isOwner || isToggling}
                        className={`w-7 h-7 rounded-md flex items-center justify-center mx-auto transition-colors ${
                          isOwner
                            ? "bg-[#10B981]/20 cursor-not-allowed"
                            : granted
                            ? "bg-[#10B981]/20 hover:bg-[#10B981]/30"
                            : "bg-surface-2 hover:bg-surface-2/80"
                        } ${isToggling ? "opacity-50" : ""}`}
                      >
                        {isOwner ? (
                          <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : granted ? (
                          <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
