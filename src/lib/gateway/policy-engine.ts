import { RiskLevel, ApprovalItem } from '../types';

export interface PolicyCheckResult {
  requiresApproval: boolean;
  policyName: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reason: string;
  approvalItem?: Partial<ApprovalItem>;
}

export const SPEND_LIMIT_THRESHOLD = 100; // $100 Rule

export class PolicyEngine {
  /**
   * Evaluates proposed agent action against enterprise governance rules.
   */
  public static evaluateAction(params: {
    agentId: string;
    agentName: string;
    actionType: ApprovalItem['actionType'];
    title: string;
    summary: string;
    amount: number;
    currency?: string;
    vendor?: string;
  }): PolicyCheckResult {
    const { agentId, agentName, actionType, title, summary, amount, currency = 'USD', vendor } = params;

    // Rule 1: Mandatory Spend Threshold ($100 rule)
    if (amount > SPEND_LIMIT_THRESHOLD) {
      return {
        requiresApproval: true,
        policyName: 'ENFORCE_SPEND_THRESHOLD_OVER_100',
        riskLevel: amount > 1000 ? 'critical' : 'high',
        riskScore: Math.min(95, 60 + Math.floor(amount / 50)),
        reason: `Policy Enforcement: Action involves expenditure of $${amount.toLocaleString()} ${currency}, which exceeds the $${SPEND_LIMIT_THRESHOLD} autonomous limit. Requires explicit user approval.`,
        approvalItem: {
          agentId,
          agentName,
          title,
          summary,
          actionType,
          amount,
          currency,
          vendor: vendor || 'Verified Enterprise Vendor',
          riskScore: Math.min(95, 60 + Math.floor(amount / 50)),
          riskLevel: amount > 1000 ? 'critical' : 'high',
          reason: `Expenditure of $${amount.toLocaleString()} exceeds the safe autonomous threshold ($${SPEND_LIMIT_THRESHOLD}).`
        }
      };
    }

    // Rule 2: Booking Flights or Hotels ALWAYS requires human confirmation
    if (actionType === 'flight_booking' || actionType === 'hotel_reservation') {
      return {
        requiresApproval: true,
        policyName: 'ENFORCE_TRAVEL_BOOKING_CONSENT',
        riskLevel: 'medium',
        riskScore: 70,
        reason: `Policy Enforcement: Travel reservations require user confirmation before lock-in.`,
        approvalItem: {
          agentId,
          agentName,
          title,
          summary,
          actionType,
          amount,
          currency,
          vendor: vendor || 'Travel Partner',
          riskScore: 70,
          riskLevel: 'medium',
          reason: `Travel reservation requires explicit itinerary confirmation.`
        }
      };
    }

    // Rule 3: Safe execution for low-risk actions under threshold
    return {
      requiresApproval: false,
      policyName: 'AUTONOMOUS_SAFE_EXECUTION',
      riskLevel: 'low',
      riskScore: 15,
      reason: `Action is within autonomous safe parameters ($${amount} <= $${SPEND_LIMIT_THRESHOLD}). Executing automatically.`
    };
  }
}
