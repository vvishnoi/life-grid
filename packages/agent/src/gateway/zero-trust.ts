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
