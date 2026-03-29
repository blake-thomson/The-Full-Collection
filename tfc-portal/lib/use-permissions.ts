"use client";
import { useState, useEffect } from "react";

export const ALL_PERMISSIONS = [
  "view_billing",
  "edit_billing",
  "delete_cards",
  "create_cards",
  "move_cards",
  "message_clients",
  "view_all_clients",
  "manage_team",
  "view_analytics",
  "export_reports",
  "manage_triggers",
  "manage_social_accounts",
  "view_time_tracking",
  "edit_time_tracking",
  "access_research",
] as const;

export const PERMISSION_LABELS: Record<string, string> = {
  view_billing: "View Billing",
  edit_billing: "Edit Billing",
  delete_cards: "Delete Cards",
  create_cards: "Create Cards",
  move_cards: "Move Cards",
  message_clients: "Message Clients",
  view_all_clients: "View All Clients",
  manage_team: "Manage Team",
  view_analytics: "View Analytics",
  export_reports: "Export Reports",
  manage_triggers: "Manage Triggers",
  manage_social_accounts: "Manage Social Accounts",
  view_time_tracking: "View Time Tracking",
  edit_time_tracking: "Edit Time Tracking",
  access_research: "Access Research",
};

export function usePermissions(userRole: string): Record<string, boolean> {
  const [perms, setPerms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userRole === "owner") {
      setPerms(Object.fromEntries(ALL_PERMISSIONS.map((p) => [p, true])));
      return;
    }

    fetch(`/api/permissions?role=${userRole}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, boolean> = {};
          data.forEach((p: { permission: string; granted: boolean }) => {
            map[p.permission] = p.granted;
          });
          setPerms(map);
        }
      })
      .catch(() => setPerms({}));
  }, [userRole]);

  return perms;
}

export function usePermission(permission: string, userRole: string): boolean {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (userRole === "owner") {
      setGranted(true);
      return;
    }

    fetch(`/api/permissions?role=${userRole}&permission=${permission}`)
      .then((r) => r.json())
      .then((data) => setGranted(data.granted ?? false))
      .catch(() => setGranted(false));
  }, [permission, userRole]);

  return granted;
}
