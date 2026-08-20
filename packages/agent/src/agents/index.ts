import { SequentialAgent, ParallelAgent } from '@google/adk';
import { securityScannerAgent } from './security/agent.js';
import { travelAgent } from './travel/agent.js';
import { familyAgent } from './family/agent.js';
import { calendarAgent } from './calendar/agent.js';
import { shoppingAgent } from './shopping/agent.js';
import { financeAgent } from './finance/agent.js';
import { planSynthesizer } from './synthesizer/agent.js';

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
export const researchPhase = new ParallelAgent({
  name: 'ResearchPhase',
  subAgents: [travelAgent, familyAgent, calendarAgent, shoppingAgent],
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
