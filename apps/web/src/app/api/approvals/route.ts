import { NextRequest, NextResponse } from 'next/server';
import {
  sessionService,
  LIFEGRID_APP_NAME,
  LIFEGRID_USER_ID,
  streamFinalPlan,
  synthesizeFinalPlan,
  type ApprovalDecisionDetail,
} from '@lifegrid/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { approvalId, action, sessionId, decisions } = body;
    // decisions: ApprovalDecisionDetail[] — full item detail, not just
    // functionCallId+action, so the finish line below can be built without
    // needing the agent pipeline to run again. ALL approvals from the same
    // batch (see ApprovalItem.batchId) arrive together — Gemini's
    // function-calling protocol requires every function call from one
    // model turn to be accounted for before the pipeline can be told to
    // move on, so a partial batch isn't meaningful here either.

    if (sessionId && Array.isArray(decisions) && decisions.length > 0) {
      const demoKey = process.env.DEMO_API_KEY;
      if (demoKey && req.headers.get('x-demo-key') !== demoKey) {
        return NextResponse.json({ success: false, error: 'Live Agents mode requires a valid demo key.' }, { status: 401 });
      }

      // Deliberately NOT calling lifeGridRunner.runAsync() again here — see
      // packages/agent/src/finalize-plan.ts for why letting the agent
      // pipeline's own continuation run after this point is unreliable.
      // Everything needed for the finish line was already written to
      // session state by the research phase, before FinanceAgent paused.
      const session = await sessionService.getSession({
        appName: LIFEGRID_APP_NAME,
        userId: LIFEGRID_USER_ID,
        sessionId,
      });
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found or expired.' }, { status: 404 });
      }

      const firstUserEvent = session.events.find((e) => e.author === 'user');
      const originalGoal = (firstUserEvent?.content?.parts?.[0] as { text?: string } | undefined)?.text || 'Your request';

      const response = streamFinalPlan(sessionId, () =>
        synthesizeFinalPlan(
          {
            originalGoal,
            budgetCap: session.state.budgetCap as number | undefined,
            travelResults: session.state.travel_results as string | undefined,
            familyResults: session.state.family_results as string | undefined,
            calendarResults: session.state.calendar_results as string | undefined,
            shoppingResults: session.state.shopping_results as string | undefined,
          },
          decisions as ApprovalDecisionDetail[],
          session.state.model as string | undefined
        )
      );
      return response;
    }

    if (!approvalId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    // Scripted mode: no real run to resume against, just acknowledge.
    return NextResponse.json({
      success: true,
      approvalId,
      action,
      timestamp: new Date().toISOString(),
      message: action === 'approve'
        ? `Action '${approvalId}' APPROVED by user. Execution authorized.`
        : `Action '${approvalId}' REJECTED by user. Re-routing task to alternative provider.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
