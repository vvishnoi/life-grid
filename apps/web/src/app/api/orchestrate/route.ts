import { NextRequest, NextResponse } from 'next/server';
import {
  PREDEFINED_SCENARIOS,
  scriptedDemoEngine,
  getLifeGridRunner,
  sessionService,
  LIFEGRID_APP_NAME,
  LIFEGRID_USER_ID,
  streamAdkEvents,
  AVAILABLE_MODELS,
  AUTO_MODEL,
  APPROVAL_THRESHOLD_OPTIONS,
  SPEND_LIMIT_THRESHOLD,
} from '@lifegrid/agent';
import { auth } from '@/auth';

const VALID_MODEL_IDS = new Set(AVAILABLE_MODELS.map((m) => m.id));
const VALID_APPROVAL_THRESHOLDS = new Set<number>(APPROVAL_THRESHOLD_OPTIONS);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId = 'denver', customPrompt, budgetCap = 4000, mode = 'scripted', model, approvalThreshold } = body;

    if (mode === 'live') {
      // Cost control (docs/COST_OPTIMIZATION.md #7): scripted mode stays
      // public/free, but the paid Vertex AI path is gated once a
      // DEMO_API_KEY is configured, so public traffic can't run up spend.
      const demoKey = process.env.DEMO_API_KEY;
      if (demoKey && req.headers.get('x-demo-key') !== demoKey) {
        return NextResponse.json({ success: false, error: 'Live Agents mode requires a valid demo key.' }, { status: 401 });
      }

      // "auto" (or anything unrecognized) falls through to `undefined`,
      // which getLifeGridRunner/each agent factory resolves to LifeGrid's
      // own built-in default model — see model.ts's AUTO_MODEL comment.
      const resolvedModel =
        typeof model === 'string' && model !== AUTO_MODEL && VALID_MODEL_IDS.has(model) ? model : undefined;

      // Settings screen — how much a single action can cost before
      // FinanceAgent's request_human_approval tool has to pause and ask
      // (tools.ts reads this same value back out of session state below).
      // Falls back to the $100 default for anything not in the fixed
      // preset list, rather than trusting an arbitrary client-supplied
      // number.
      const resolvedApprovalThreshold =
        typeof approvalThreshold === 'number' && VALID_APPROVAL_THRESHOLDS.has(approvalThreshold)
          ? approvalThreshold
          : SPEND_LIMIT_THRESHOLD;

      // If the user signed in with Google (Sidebar's "Connect Google
      // Calendar"), CalendarAgent's tool picks this token up from session
      // state and calls the real Calendar API instead of its simulated
      // fallback — see packages/agent/src/tools.ts.
      const userSession = await auth();
      const sessionId = crypto.randomUUID();
      await sessionService.createSession({
        appName: LIFEGRID_APP_NAME,
        userId: LIFEGRID_USER_ID,
        sessionId,
        state: {
          budgetCap,
          googleCalendarAccessToken: userSession?.calendarAccessToken,
          model: resolvedModel,
          approvalThreshold: resolvedApprovalThreshold,
        },
      });

      const events = getLifeGridRunner(resolvedModel).runAsync({
        userId: LIFEGRID_USER_ID,
        sessionId,
        newMessage: { role: 'user', parts: [{ text: customPrompt || 'Plan Denver Trip' }] },
      });

      return streamAdkEvents(events, sessionId, false, resolvedApprovalThreshold);
    }

    // Scripted branch — unchanged existing simulation.
    const promptToScan = customPrompt || (PREDEFINED_SCENARIOS[scenarioId]?.userPrompt || 'Plan Denver Trip');
    const scanResult = scriptedDemoEngine.scanPrompt(promptToScan);
    const scenario = PREDEFINED_SCENARIOS[scenarioId] || PREDEFINED_SCENARIOS.denver;

    return NextResponse.json({
      success: true,
      scenarioId,
      userPrompt: promptToScan,
      budgetCap,
      securityScan: scanResult,
      steps: scenario.steps
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
