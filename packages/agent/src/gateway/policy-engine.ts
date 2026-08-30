import { RiskLevel, ApprovalItem } from '../types.js';

export interface PolicyCheckResult {
  requiresApproval: boolean;
  policyName: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reason: string;
  approvalItem?: Partial<ApprovalItem>;
}

// Default only — a per-request threshold (Settings screen, Live mode only)
// is threaded through from session state and takes precedence. See
// tools.ts's request_human_approval and event-mapper.ts, the two call
// sites that actually need the configured value, not just this default.
export const SPEND_LIMIT_THRESHOLD = 100;

// Preset choices shown in Settings — kept as a small fixed list (like
// AVAILABLE_MODELS) rather than a free-form number input, so a user can't
// accidentally configure something the rest of the UI's copy ("over $100")
// wasn't written to describe.
export const APPROVAL_THRESHOLD_OPTIONS = [100, 250, 500, 1000, 2500];

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
    threshold?: number;
  }): PolicyCheckResult {
    const { agentId, agentName, actionType, title, summary, amount, currency = 'USD', vendor, threshold = SPEND_LIMIT_THRESHOLD } = params;

    // Rule 1: Mandatory Spend Threshold
    if (amount > threshold) {
      return {
        requiresApproval: true,
        policyName: 'ENFORCE_SPEND_THRESHOLD',
        riskLevel: amount > threshold * 10 ? 'critical' : 'high',
        riskScore: Math.min(95, 60 + Math.floor(amount / 50)),
        reason: `Policy Enforcement: Action involves expenditure of $${amount.toLocaleString()} ${currency}, which exceeds the $${threshold.toLocaleString()} autonomous limit. Requires explicit user approval.`,
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
          riskLevel: amount > threshold * 10 ? 'critical' : 'high',
          reason: `Expenditure of $${amount.toLocaleString()} exceeds the safe autonomous threshold ($${threshold.toLocaleString()}).`
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
      reason: `Action is within autonomous safe parameters ($${amount} <= $${threshold}). Executing automatically.`
    };
  }
}
