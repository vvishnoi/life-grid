// Public API of @lifegrid/agent.
//
// This package is the entire LifeGrid multi-agent pipeline — real Google
// ADK agents, tools, governance gateways, memory, and the ADK Runner — with
// zero dependency on Next.js or any particular UI. Anything in here is safe
// to import from a different frontend, a CLI, or a test harness.
//
// See README.md for a minimal standalone usage example.

// ── Agents & orchestration ──────────────────────────────────────────────
export {
  lifeGridOrchestrator,
  researchPhase,
  securityScannerAgent,
  travelAgent,
  familyAgent,
  calendarAgent,
  shoppingAgent,
  financeAgent,
  planWriter,
  buildLifeGridOrchestrator,
} from './agents/index.js';
export { geminiModel, AVAILABLE_MODELS, AUTO_MODEL, type ModelOption } from './model.js';

// ── Runner (drives the agents; owns session state) ──────────────────────
export {
  lifeGridRunner,
  getLifeGridRunner,
  sessionService,
  LIFEGRID_APP_NAME,
  LIFEGRID_USER_ID,
} from './runner.js';
export { buildApprovalResumeMessage, type ApprovalDecision } from './approvals.js';

// ── Streaming a run out as telemetry ────────────────────────────────────
export { streamAdkEvents, streamFinalPlan, type OrchestrationFrame } from './stream-response.js';
export { mapAdkEventToTelemetryLogs } from './event-mapper.js';
export {
  synthesizeFinalPlan,
  type ApprovalDecisionDetail,
  type SessionResearchContext,
} from './finalize-plan.js';

// ── Governance gateways (Agent Gateway / Model Armor / Zero-Trust pillars) ─
export { ModelArmorGateway, type SecurityScanResult } from './gateway/model-armor.js';
export { PolicyEngine, SPEND_LIMIT_THRESHOLD, type PolicyCheckResult } from './gateway/policy-engine.js';
export { ZeroTrustGateway, createZeroTrustCallback, type ZeroTrustValidation } from './gateway/zero-trust.js';

// ── Memory Bank (cross-session preferences) ─────────────────────────────
export { memoryBank, type MemoryBank } from './memory/index.js';

// ── Agent Registry (Discovery & Lifecycle pillar) ───────────────────────
export { ENTERPRISE_AGENT_REGISTRY, getAgentById } from './registry.js';

// ── Zero-cost scripted demo mode (FR-9) ─────────────────────────────────
export { PREDEFINED_SCENARIOS, scriptedDemoEngine, type PredefinedScenarioData } from './scripted-demo.js';
export { buildScriptedFinalPlan } from './scripted-final-plan.js';

// ── Shared data contracts ───────────────────────────────────────────────
export * from './types.js';
