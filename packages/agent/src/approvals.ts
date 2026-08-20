import { createPartFromFunctionResponse } from '@google/genai';

export interface ApprovalDecision {
  functionCallId: string;
  action: 'approve' | 'reject';
}

// Builds the ADK `newMessage` that resumes a paused run after a batch of
// human approval decisions. Wraps @google/genai's function-response Part
// construction so UI-side callers don't need that package as a direct
// dependency — the agent package owns the ADK/genai wiring end to end.
export function buildApprovalResumeMessage(decisions: ApprovalDecision[]) {
  return {
    role: 'user' as const,
    parts: decisions.map((d) =>
      createPartFromFunctionResponse(d.functionCallId, 'adk_request_confirmation', {
        confirmed: d.action === 'approve',
      })
    ),
  };
}
