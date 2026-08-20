import { NextRequest, NextResponse } from 'next/server';
import { lifeGridRunner, LIFEGRID_USER_ID, streamAdkEvents, buildApprovalResumeMessage } from '@lifegrid/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { approvalId, action, sessionId, decisions } = body;
    // decisions: [{ functionCallId, action: 'approve' | 'reject' }, ...]
    // ALL approvals from the same batch (see ApprovalItem.batchId) must be
    // resolved together — Gemini's function-calling protocol requires every
    // function call from one model turn to get a response before the next
    // turn can proceed, so a partial resume with only some responses fails
    // at the API level.

    if (sessionId && Array.isArray(decisions) && decisions.length > 0) {
      const demoKey = process.env.DEMO_API_KEY;
      if (demoKey && req.headers.get('x-demo-key') !== demoKey) {
        return NextResponse.json({ success: false, error: 'Live Agents mode requires a valid demo key.' }, { status: 401 });
      }

      const events = lifeGridRunner.runAsync({
        userId: LIFEGRID_USER_ID,
        sessionId,
        newMessage: buildApprovalResumeMessage(decisions),
      });

      return streamAdkEvents(events, sessionId, /* isResume */ true);
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
