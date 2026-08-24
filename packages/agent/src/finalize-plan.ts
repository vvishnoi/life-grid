import { GoogleGenAI } from '@google/genai';
import { geminiModel } from './model.js';

export interface ApprovalDecisionDetail {
  functionCallId: string;
  action: 'approve' | 'reject';
  title: string;
  amount: number;
  actionType: string;
  vendor?: string;
}

export interface SessionResearchContext {
  originalGoal: string;
  budgetCap?: number;
  travelResults?: string;
  familyResults?: string;
  calendarResults?: string;
  shoppingResults?: string;
}

// Writes the final plan summary as one plain, non-agentic Vertex AI call —
// deliberately NOT another turn of the real agent pipeline. See
// packages/agent/src/tools.ts's requestApproval comment: letting
// FinanceAgent's own LLM continuation run immediately after a batch resume
// is a real, reproducible ADK 1.6.0 protocol error (confirmed live,
// 2026-08-23), and three different mitigations inside the agent pipeline
// itself didn't reliably stop it. This sidesteps ADK's resumability for the
// finish line entirely, using only research data already gathered before
// the approval pause (read directly from ADK session state — see
// apps/web/src/app/api/approvals/route.ts) plus the decisions the user just
// made. Trade-off: this step isn't a "real agent" in the SequentialAgent
// sense — no tool calls, no session-state read via ADK's own mechanisms —
// but it's the same Gemini model doing the actual writing, and it can't hit
// the resumability bug because it isn't part of that conversation at all.
export async function synthesizeFinalPlan(
  context: SessionResearchContext,
  decisions: ApprovalDecisionDetail[],
  model: string = geminiModel
): Promise<string> {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  });

  const decisionLines = decisions
    .map(
      (d) =>
        `- ${d.title} ($${d.amount.toLocaleString()}, ${d.actionType}${d.vendor ? `, ${d.vendor}` : ''}): ${
          d.action === 'approve' ? 'APPROVED' : 'DECLINED'
        }`
    )
    .join('\n');

  const prompt = `You are LifeGrid's Plan Synthesizer. Write the final, polished summary for the user's request, now that they've reviewed and decided on every item that needed their approval.

Original request: ${context.originalGoal}
${context.budgetCap ? `Budget cap: $${context.budgetCap.toLocaleString()}` : ''}

Travel & Lodging research:
${context.travelResults || '(not available)'}

Family & Activities research:
${context.familyResults || '(not available)'}

Calendar check:
${context.calendarResults || '(not available)'}

Shopping & Gear research:
${context.shoppingResults || '(not available)'}

The user's decisions on the items that needed approval:
${decisionLines}

Write a clear, well-organized final summary in markdown (headings, bold, lists) covering:
1. Trip/outcome overview
2. What was approved vs. declined, with amounts
3. Final budget total — count ONLY approved spending plus any costs that never needed approval in the first place
4. Any notes, e.g. what to reconsider for anything declined

Be concise but complete. This is the final message the user sees — present the finished summary, don't ask any follow-up questions.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text ?? 'Your decisions were recorded, but LifeGrid could not generate a written summary this time.';
}
