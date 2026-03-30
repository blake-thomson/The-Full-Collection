import type { OnboardingData } from "./constants";

/** Client (from clients table) */
export interface Client {
  id: string;
  name: string;
  email: string;
  onboarding_complete: boolean;
  onboarding_data: OnboardingData | null;
  profile_complete?: boolean;
  created_at: string;
  bio?: string;
  avatar_url?: string;
  industry?: string;
}

/** Team member (from team_members table) */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

/** Kanban card (from kanban_cards table) */
export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  platform?: string;
  column_id: string;
  position: number;
  due_date?: string;
  priority?: "low" | "medium" | "high";
  created_at?: string;
  content_style?: string;
  content_type?: string;
  reference_url?: string;
  unedited_url?: string;
  edited_video_url?: string;
  assigned_editor?: string;
  shoot_date?: string;
  edit_deadline?: string;
  publish_date?: string;
  shoot_location?: string;
}

/** Current user context passed to components */
export interface CurrentUser {
  name: string;
  email: string;
  type: "client" | "team";
}
