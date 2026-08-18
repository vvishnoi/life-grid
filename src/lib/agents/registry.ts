import { AgentInfo } from '../types';

export const ENTERPRISE_AGENT_REGISTRY: AgentInfo[] = [
  {
    id: 'orchestrator',
    name: 'Goal Orchestrator',
    role: 'Central Intent Decomposition & Task Dispatcher',
    category: 'core',
    description: 'Receives natural language user goals, analyzes constraints, spawns specialized agents, and monitors execution telemetry.',
    icon: 'Brain',
    status: 'idle',
    capabilities: [
      'Decomposes multi-intent prompts into atomic agent tasks',
      'Monitors global goal progress & budget envelope',
      'Resolves cross-agent interdependencies',
      'Invokes Model Armor Security Gateway before task dispatch'
    ],
    permissions: [
      { domain: 'agent_registry', access: 'read', description: 'Can inspect agent capabilities' },
      { domain: 'goal_state', access: 'write', description: 'Can update master goal telemetry' },
      { domain: 'financial_credentials', access: 'none', description: 'Zero-trust: No direct access to payment tokens' }
    ],
    riskProfile: 'Low Risk (Read & Orchestrate Only)'
  },
  {
    id: 'security-agent',
    name: 'Model Armor Security Scanner',
    role: 'Prompt Injection & Threat Interception Gateway',
    category: 'core',
    description: 'Runs first in every pipeline. Scans user goals and external content for prompt injection, data exfiltration, and malicious payloads before any agent acts on them.',
    icon: 'ShieldCheck',
    status: 'idle',
    capabilities: [
      'Scans user prompts and external content via Model Armor',
      'Neutralizes detected prompt injection payloads',
      'Blocks downstream agents from acting on malicious input',
      'Reports sanitized input for safe pipeline continuation'
    ],
    permissions: [
      { domain: 'user_input', access: 'read', description: 'Reads raw user goal text before dispatch' },
      { domain: 'agent_registry', access: 'none', description: 'Cannot modify other agents directly' },
      { domain: 'financial_credentials', access: 'none', description: 'Zero-trust: No access to payment tokens' }
    ],
    riskProfile: 'Low Risk (Read & Inspect Only)'
  },
  {
    id: 'travel-agent',
    name: 'Travel & Lodging Agent',
    role: 'Flight & Hotel Research Specialist',
    category: 'travel',
    description: 'Searches flights, hotel accommodations, and local transit. Filters results against past lodging preferences.',
    icon: 'Plane',
    status: 'idle',
    capabilities: [
      'Queries live flight schedules and lodging availability',
      'Validates hotel proximity against user preferences (e.g. downtown distance)',
      'Generates exact itinerary booking quotes',
      'Submits high-value checkout actions to Approval Center'
    ],
    permissions: [
      { domain: 'travel_apis', access: 'read', description: 'Can search public travel providers' },
      { domain: 'user_preferences', access: 'read', description: 'Can read lodging & seat preferences' },
      { domain: 'financial_credentials', access: 'none', description: 'Zero-trust: Restricted from direct card charges' }
    ],
    riskProfile: 'Medium-High (External API & Purchases)'
  },
  {
    id: 'family-agent',
    name: 'Family & Activities Agent',
    role: 'Schedule, Age & Preference Coordinator',
    category: 'family',
    description: 'Maintains family profiles, dietary restrictions, kid-friendly activity filters, and personal preferences.',
    icon: 'Users',
    status: 'idle',
    capabilities: [
      'Matches activity recommendations with age constraints',
      'Enforces dietary & accessibility rules',
      'Persists newly discovered family preferences to Firestore Memory Bank',
      'Filters out high-risk or unverified event vendors'
    ],
    permissions: [
      { domain: 'family_profiles', access: 'read', description: 'Reads dietary and age parameters' },
      { domain: 'memory_bank', access: 'write', description: 'Writes learned preferences to Firestore' },
      { domain: 'financial_credentials', access: 'none', description: 'Zero-trust: Cannot execute financial transactions' }
    ],
    riskProfile: 'Low Risk (Preferences & Recommendations)'
  },
  {
    id: 'calendar-agent',
    name: 'Calendar & Time Agent',
    role: 'Schedule Conflict Resolution Specialist',
    category: 'calendar',
    description: 'Inspects household calendars, identifies free time windows, resolves event overlaps, and holds tentative time blocks.',
    icon: 'Calendar',
    status: 'idle',
    capabilities: [
      'Audits family calendar availability across Google Workspace / Outlook',
      'Holds temporary hold slots during trip planning',
      'Calculates travel buffer times between itinerary destinations',
      'Alerts user of unresolvable appointment conflicts'
    ],
    permissions: [
      { domain: 'calendar_events', access: 'read', description: 'Reads availability and event titles' },
      { domain: 'calendar_events', access: 'write', description: 'Creates hold reservations' },
      { domain: 'financial_credentials', access: 'none', description: 'Zero-trust: No financial access' }
    ],
    riskProfile: 'Low-Medium (Internal Schedule Mutator)'
  },
  {
    id: 'finance-agent',
    name: 'Finance & Budget Agent',
    role: 'Cost Auditor & Policy Guard',
    category: 'finance',
    description: 'Monitors total trip spending against user budget caps, calculates taxes/fees, and enforces the $100 human-in-the-loop approval rule.',
    icon: 'Wallet',
    status: 'idle',
    capabilities: [
      'Audits itemized expenses across all agents',
      'Enforces $100 threshold policy for human approval',
      'Tracks cumulative remaining budget envelope',
      'Validates merchant authenticity before transaction approval'
    ],
    permissions: [
      { domain: 'budget_caps', access: 'read', description: 'Reads active spending envelope' },
      { domain: 'approval_center', access: 'write', description: 'Triggers approval tickets for spend > $100' },
      { domain: 'raw_card_numbers', access: 'none', description: 'Zero-trust: Uses tokenized authorization gateway' }
    ],
    riskProfile: 'High Risk (Policy Enforcement & Spend Tracking)'
  },
  {
    id: 'shopping-agent',
    name: 'Household & Shopping Agent',
    role: 'Equipment, Packing & Purchasing Assistant',
    category: 'shopping',
    description: 'Generates packing checklists, identifies required gear (e.g. winter jackets for Denver), and checks local/online store pricing.',
    icon: 'ShoppingBag',
    status: 'idle',
    capabilities: [
      'Generates destination-specific packing requirements',
      'Checks inventory and price comparisons',
      'Submits purchase requests for missing gear to Approval Center',
      'Tracks order delivery ETAs'
    ],
    permissions: [
      { domain: 'e_commerce_catalogs', access: 'read', description: 'Reads store pricing & inventory' },
      { domain: 'approval_center', access: 'write', description: 'Submits order tickets' },
      { domain: 'financial_credentials', access: 'none', description: 'Zero-trust: Requires user tokenized approval' }
    ],
    riskProfile: 'Medium Risk (Order Placement)'
  }
];

export function getAgentById(id: string): AgentInfo | undefined {
  return ENTERPRISE_AGENT_REGISTRY.find(agent => agent.id === id);
}
