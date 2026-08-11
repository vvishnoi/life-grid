// Mock data for development — used when NEXT_PUBLIC_API_URL is unset.
// Shapes must exactly match lib/types.ts

import type { Mission, Task, Approval, Preference } from "@/lib/types";

export const MOCK_MISSION: Mission = {
  id: "demo-mission-001",
  user_id: "demo-user",
  goal: "Plan a 5-day family trip under $4,000",
  status: "in_progress",
  created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  budget_used: 1240,
  budget_limit: 4000,
};

export const MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    agent: "travel_agent",
    description: "Searching for round-trip flights from JFK to Orlando for 4 pax",
    status: "running",
    risk_level: "low",
    updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: "task-2",
    agent: "finance_agent",
    description: "Analysing budget allocation: flights 40%, hotel 35%, activities 25%",
    status: "needs_approval",
    risk_level: "high",
    updated_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
  },
  {
    id: "task-3",
    agent: "family_agent",
    description: "Checking school calendar for spring break availability",
    status: "completed",
    risk_level: "low",
    result: { break_start: "2025-04-12", break_end: "2025-04-20" },
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "task-4",
    agent: "calendar_agent",
    description: "Blocking travel dates and sending calendar invites",
    status: "pending",
    risk_level: "low",
    updated_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: "task-5",
    agent: "home_agent",
    description: "Arranging pet sitting and mail hold for travel dates",
    status: "pending",
    risk_level: "low",
    updated_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: "task-6",
    agent: "shopping_agent",
    description: "Comparing travel insurance plans for 4 travellers",
    status: "rejected",
    risk_level: "low",
    updated_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
];

export const MOCK_APPROVALS: Approval[] = [
  {
    id: "approval-1",
    task_id: "task-2",
    action: "Book Delta flight DL1234 JFK→MCO for $820 total (4 pax)",
    risk_level: "high",
    status: "pending",
    requested_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
  },
];

export const MOCK_PREFERENCES: Preference[] = [
  {
    id: "pref-1",
    topic: "Travel",
    learned_fact: "Prefers aisle seats and Delta over United",
    confidence: 0.92,
    source_mission: "demo-mission-001",
  },
  {
    id: "pref-2",
    topic: "Budget",
    learned_fact: "Value-conscious — avoids impulse upgrades",
    confidence: 0.87,
    source_mission: "demo-mission-001",
  },
  {
    id: "pref-3",
    topic: "Family",
    learned_fact: "2 adults, 2 children (ages 8 and 11). Daughter is vegetarian.",
    confidence: 0.95,
    source_mission: "demo-mission-001",
  },
  {
    id: "pref-4",
    topic: "Scheduling",
    learned_fact: "Prefers travel on weekends to avoid school days",
    confidence: 0.78,
    source_mission: "demo-mission-001",
  },
];

export const MOCK_MISSIONS: Mission[] = [
  MOCK_MISSION,
  {
    id: "demo-mission-000",
    user_id: "demo-user",
    goal: "Make next week less hectic",
    status: "completed",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    budget_used: 0,
    budget_limit: 0,
  },
];
