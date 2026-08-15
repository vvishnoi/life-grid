export type AgentStatus = 'idle' | 'analyzing' | 'executing' | 'waiting_approval' | 'completed' | 'error';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AgentPermission {
  domain: string;
  access: 'read' | 'write' | 'none';
  description: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  category: 'core' | 'travel' | 'family' | 'calendar' | 'finance' | 'shopping';
  description: string;
  icon: string;
  status: AgentStatus;
  capabilities: string[];
  permissions: AgentPermission[];
  riskProfile: string;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'orchestration' | 'thought' | 'tool_call' | 'security_inspection' | 'approval_required' | 'memory_update' | 'execution_success' | 'security_alert';
  message: string;
  metadata?: Record<string, any>;
  riskLevel?: RiskLevel;
  threatDetected?: boolean;
}

export interface ApprovalItem {
  id: string;
  goalId: string;
  agentId: string;
  agentName: string;
  title: string;
  summary: string;
  actionType: 'flight_booking' | 'hotel_reservation' | 'activity_booking' | 'shopping_purchase' | 'budget_override';
  amount: number;
  currency: string;
  vendor?: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface MemoryItem {
  id: string;
  category: 'preference' | 'past_trip' | 'schedule_rule' | 'family_profile' | 'budget_rule';
  key: string;
  value: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sourceAgent: string;
  updatedAt: string;
}

export interface GoalScenario {
  id: string;
  title: string;
  prompt: string;
  budgetCap: number;
  description: string;
  badge: string;
}

export interface GoalExecutionState {
  goalId: string;
  userPrompt: string;
  status: 'initializing' | 'decomposing' | 'in_progress' | 'waiting_approval' | 'completed' | 'failed';
  budgetCap: number;
  spentAmount: number;
  logs: TelemetryLog[];
  pendingApprovals: ApprovalItem[];
  approvedActions: ApprovalItem[];
  memories: MemoryItem[];
}
