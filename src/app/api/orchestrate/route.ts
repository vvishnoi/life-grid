import { NextRequest, NextResponse } from 'next/server';
import { PREDEFINED_SCENARIOS, orchestratorEngine } from '@/lib/agents/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId = 'denver', customPrompt, budgetCap = 4000 } = body;

    // First scan prompt with Model Armor
    const promptToScan = customPrompt || (PREDEFINED_SCENARIOS[scenarioId]?.userPrompt || 'Plan Denver Trip');
    const scanResult = orchestratorEngine.scanPrompt(promptToScan);

    // Get scenario steps or build custom steps
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
