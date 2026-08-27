import type { Context, SingleAgentCallback } from '@google/adk';

// The state key scanWithModelArmor (tools.ts) sets when ModelArmorGateway
// flags a threat. tool_context.state and beforeAgentCallback's context.state
// both wrap the SAME underlying session.state object (see ADK's
// agents/context.js — `new State(invocationContext.session.state, ...)`),
// so a value set here during SecurityScannerAgent's own turn is already
// visible to every later agent's beforeAgentCallback in this run, with no
// extra plumbing needed.
export const SECURITY_THREAT_STATE_KEY = 'security_threat_detected';

// event-mapper.ts matches on this exact text to render it as a proper
// security_alert (not fall through to the generic CONTENT branch, which
// would otherwise misclassify it as a real finished plan — see PlanWriter
// case below).
export const SECURITY_BLOCK_PRIMARY_MESSAGE =
  'LifeGrid stopped here — Model Armor detected and blocked a prompt-injection attempt in your request, so research, budgeting, and booking never ran.';

export const SECURITY_BLOCK_SKIP_MESSAGE =
  'Skipped — a security block earlier in this run stopped the pipeline before this step.';

// A fixed SequentialAgent (agents/index.ts) has no built-in way to let one
// stage's result skip the rest — ADK's own SequentialAgent.runAsyncImpl just
// loops through subAgents unconditionally. beforeAgentCallback IS the
// documented ADK mechanism for this: returning Content from it skips that
// specific agent's own run and uses the content as its output instead (see
// BaseAgent's handleBeforeAgentCallback). Applying the same callback to
// ResearchPhase, FinanceAgent, and PlanWriter makes the security gate
// actually gate something, instead of just narrating a threat that every
// downstream agent still acts as if nothing happened.
export function createSecurityGateCallback(message: string): SingleAgentCallback {
  return (context: Context) => {
    if (context.state.get<boolean>(SECURITY_THREAT_STATE_KEY)) {
      return { role: 'model', parts: [{ text: message }] };
    }
    return undefined;
  };
}
