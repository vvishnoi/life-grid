// LifeGrid — Firestore schema types (exact match, do not drift)

export type MissionStatus =
  | "pending"
  | "in_progress"
  | "paused"
  | "completed"
  | "failed";

export type TaskStatus =
  | "pending"
  | "running"
  | "needs_approval"
  | "completed"
  | "rejected";

export type RiskLevel = "low" | "high";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type AgentId =
  | "travel_agent"
  | "family_agent"
  | "calendar_agent"
  | "finance_agent"
  | "home_agent"
  | "shopping_agent"
  | "communication_agent";

export const ALL_AGENTS: AgentId[] = [
  "travel_agent",
  "family_agent",
  "calendar_agent",
  "finance_agent",
  "home_agent",
  "shopping_agent",
  "communication_agent",
];

export const AGENT_DISPLAY_NAMES: Record<AgentId, string> = {
  travel_agent: "Travel",
  family_agent: "Family",
  calendar_agent: "Calendar",
  finance_agent: "Finance",
  home_agent: "Home",
  shopping_agent: "Shopping",
  communication_agent: "Communication",
};

export interface Mission {
  id: string;
  user_id: string;
  goal: string;
  status: MissionStatus;
  created_at: string;
  budget_used: number;
  budget_limit: number;
}

export interface Task {
  id: string;
  agent: AgentId;
  description: string;
  status: TaskStatus;
  risk_level: RiskLevel;
  result?: Record<string, unknown>;
  updated_at?: string;
}

export interface Approval {
  id: string;
  task_id: string;
  action: string;
  risk_level: RiskLevel;
  status: ApprovalStatus;
  requested_at: string;
}

export interface Preference {
  id: string;
  topic: string;
  learned_fact: string;
  confidence: number;
  source_mission: string;
}
