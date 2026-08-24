import { SequentialAgent, ParallelAgent } from '@google/adk';
import { securityScannerAgent, createSecurityScannerAgent } from './security/agent.js';
import { travelAgent, createTravelAgent } from './travel/agent.js';
import { familyAgent, createFamilyAgent } from './family/agent.js';
import { calendarAgent, createCalendarAgent } from './calendar/agent.js';
import { shoppingAgent, createShoppingAgent } from './shopping/agent.js';
import { financeAgent, createFinanceAgent } from './finance/agent.js';
import { planSynthesizer, createPlanSynthesizer } from './synthesizer/agent.js';
import { createSecurityGateCallback, SECURITY_BLOCK_PRIMARY_MESSAGE } from '../gateway/security-gate.js';

export {
  securityScannerAgent,
  travelAgent,
  familyAgent,
  calendarAgent,
  shoppingAgent,
  financeAgent,
  planSynthesizer,
};

// Research phase: Travel, Family, Calendar, and Shopping are mutually
// independent (none reads another's outputKey), so they run concurrently —
// four Flash calls in the time of one instead of four in sequence.
//
// beforeAgentCallback is the actual security stop, not just its narration.
// SequentialAgent.runAsyncImpl loops through Security -> Research -> Finance
// -> Synthesize unconditionally — it has no idea SecurityScanner found a
// threat unless something checks. This is that something: if
// scanWithModelArmor flagged security_threat_detected in session state,
// ResearchPhase's own run is skipped entirely (per ADK's documented
// beforeAgentCallback contract — see gateway/security-gate.ts) instead of
// four research agents quietly running anyway after a blocked threat.
export const researchPhase = new ParallelAgent({
  name: 'ResearchPhase',
  subAgents: [travelAgent, familyAgent, calendarAgent, shoppingAgent],
  beforeAgentCallback: createSecurityGateCallback(SECURITY_BLOCK_PRIMARY_MESSAGE),
});

// Root pipeline: Security -> Research -> Finance -> Synthesize.
//
// A fixed SequentialAgent, not a dynamic/routed multi-agent pattern — the
// security gate must be structurally unskippable. A model deciding its own
// control flow could in principle be reasoned or prompt-injected into
// skipping it; a fixed subAgents array cannot skip a step, because it's not
// a decision the model gets to make. See docs/IMPLEMENTATION_PLAN.md §2.3.
export const lifeGridOrchestrator = new SequentialAgent({
  name: 'LifeGridOrchestrator',
  subAgents: [securityScannerAgent, researchPhase, financeAgent, planSynthesizer],
});

// Builds a fresh, independent copy of the whole pipeline wired to one
// model — used to let a user pick a model per run (see
// runner.ts's getLifeGridRunner) without mutating the shared default
// singletons above, which would race across concurrent requests using
// different models.
export function buildLifeGridOrchestrator(model?: string): SequentialAgent {
  const security = createSecurityScannerAgent(model);
  const travel = createTravelAgent(model);
  const family = createFamilyAgent(model);
  const calendar = createCalendarAgent(model);
  const shopping = createShoppingAgent(model);
  const finance = createFinanceAgent(model);
  const synthesizer = createPlanSynthesizer(model);

  const research = new ParallelAgent({
    name: 'ResearchPhase',
    subAgents: [travel, family, calendar, shopping],
    beforeAgentCallback: createSecurityGateCallback(SECURITY_BLOCK_PRIMARY_MESSAGE),
  });

  return new SequentialAgent({
    name: 'LifeGridOrchestrator',
    subAgents: [security, research, finance, synthesizer],
  });
}
