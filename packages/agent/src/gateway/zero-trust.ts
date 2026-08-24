import type { SingleBeforeToolCallback } from '@google/adk';
import { getAgentById } from '../registry.js';

export interface ZeroTrustValidation {
  isAllowed: boolean;
  agentId: string;
  targetDomain: string;
  accessRequested: 'read' | 'write';
  reason: string;
}

export class ZeroTrustGateway {
  /**
   * Validates whether an agent has authorized access to a specific domain resource.
   */
  public static validateAccess(
    agentId: string,
    targetDomain: string,
    accessRequested: 'read' | 'write'
  ): ZeroTrustValidation {
    const agent = getAgentById(agentId);

    if (!agent) {
      return {
        isAllowed: false,
        agentId,
        targetDomain,
        accessRequested,
        reason: `Zero-Trust Alert: Agent '${agentId}' is not registered in the Enterprise Fleet Directory.`
      };
    }

    // Find permission matching target domain
    const permission = agent.permissions.find(p => p.domain === targetDomain);

    if (!permission || permission.access === 'none') {
      return {
        isAllowed: false,
        agentId,
        targetDomain,
        accessRequested,
        reason: `Zero-Trust Policy Violation: ${agent.name} does NOT have '${accessRequested}' access to domain '${targetDomain}'. Access Denied.`
      };
    }

    if (accessRequested === 'write' && permission.access === 'read') {
      return {
        isAllowed: false,
        agentId,
        targetDomain,
        accessRequested,
        reason: `Zero-Trust Policy Violation: ${agent.name} has read-only access to '${targetDomain}', write operation blocked.`
      };
    }

    return {
      isAllowed: true,
      agentId,
      targetDomain,
      accessRequested,
      reason: `Zero-Trust Verification Passed: ${agent.name} granted ${accessRequested} access to '${targetDomain}'.`
    };
  }
}

// ─────────────────────────────────────────────────────
// TOOL -> REGISTRY DOMAIN POLICY
// ─────────────────────────────────────────────────────
// Which Agent Registry permission domain (registry.ts) each tool call is
// checked against, and what access level it needs. This is the missing
// link that makes the Registry's declared permissions actually enforced,
// rather than descriptive text the UI shows but nothing reads. Every tool
// in tools.ts must have an entry here — an unlisted tool is denied by
// default (fail-closed), not silently allowed, so a new tool can't bypass
// zero-trust just by omission.
const TOOL_ACCESS_REQUIREMENTS: Record<string, { domain: string; access: 'read' | 'write' }> = {
  read_memory_bank: { domain: 'memory_bank', access: 'read' },
  write_memory_bank: { domain: 'memory_bank', access: 'write' },
  scan_with_model_armor: { domain: 'user_input', access: 'read' },
  request_human_approval: { domain: 'approval_center', access: 'write' },
  check_budget_status: { domain: 'budget_caps', access: 'read' },
  search_flights: { domain: 'travel_apis', access: 'read' },
  search_hotels: { domain: 'travel_apis', access: 'read' },
  check_calendar_availability: { domain: 'calendar_events', access: 'read' },
  search_activities: { domain: 'family_profiles', access: 'read' },
  search_gear_and_supplies: { domain: 'e_commerce_catalogs', access: 'read' },
};

/**
 * Builds the `beforeToolCallback` for one agent — the real ADK extension
 * point (LlmAgentConfig.beforeToolCallback) that runs before every tool
 * call that agent makes. Returning a Record short-circuits the real tool
 * and becomes its result; returning undefined lets the call proceed.
 *
 * `agentId` is fixed per call site (each agents/<name>/agent.ts wires its
 * own registry id), not derived from ADK's runtime context — an agent's
 * identity for zero-trust purposes is which file constructed it, not
 * something to look up dynamically per call.
 */
export function createZeroTrustCallback(agentId: string): SingleBeforeToolCallback {
  return ({ tool }) => {
    const requirement = TOOL_ACCESS_REQUIREMENTS[tool.name];
    if (!requirement) {
      return {
        zeroTrustDenied: true,
        reason: `Zero-Trust Policy Violation: no declared access-domain policy for tool '${tool.name}' — denying by default.`,
      };
    }

    const result = ZeroTrustGateway.validateAccess(agentId, requirement.domain, requirement.access);
    if (!result.isAllowed) {
      return { zeroTrustDenied: true, reason: result.reason };
    }
    return undefined;
  };
}
