import { NextRequest, NextResponse } from 'next/server';
import { PREDEFINED_SCENARIOS, orchestratorEngine } from '@/lib/agents/orchestrator';
import { lifeGridRunner, sessionService, LIFEGRID_APP_NAME, LIFEGRID_USER_ID } from '@/lib/adk/runner';
import { streamAdkEvents } from '@/lib/adk/stream-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId = 'denver', customPrompt, budgetCap = 4000, mode = 'scripted' } = body;

    if (mode === 'live') {
      // Cost control (docs/COST_OPTIMIZATION.md #7): scripted mode stays
      // public/free, but the paid Vertex AI path is gated once a
      // DEMO_API_KEY is configured, so public traffic can't run up spend.
      const demoKey = process.env.DEMO_API_KEY;
      if (demoKey && req.headers.get('x-demo-key') !== demoKey) {
        return NextResponse.json({ success: false, error: 'Live Agents mode requires a valid demo key.' }, { status: 401 });
      }

      const sessionId = crypto.randomUUID();
      await sessionService.createSession({
        appName: LIFEGRID_APP_NAME,
        userId: LIFEGRID_USER_ID,
        sessionId,
        state: { budgetCap },
      });

      const events = lifeGridRunner.runAsync({
        userId: LIFEGRID_USER_ID,
        sessionId,
        newMessage: { role: 'user', parts: [{ text: customPrompt || 'Plan Denver Trip' }] },
      });

      return streamAdkEvents(events, sessionId);
    }

    // Scripted branch — unchanged existing simulation.
    const promptToScan = customPrompt || (PREDEFINED_SCENARIOS[scenarioId]?.userPrompt || 'Plan Denver Trip');
    const scanResult = orchestratorEngine.scanPrompt(promptToScan);
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
