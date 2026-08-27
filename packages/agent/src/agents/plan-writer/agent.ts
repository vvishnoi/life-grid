import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { createSecurityGateCallback, SECURITY_BLOCK_SKIP_MESSAGE } from '../../gateway/security-gate.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');
const instructionText = readFileSync(instructionsPath, 'utf-8');

// Runs LAST — compiles every other agent's output into one final plan.
export function createPlanWriter(model: string = geminiModel): LlmAgent {
  return new LlmAgent({
    name: 'PlanWriter',
    model,
    instruction: instructionText,
    tools: [],
    outputKey: 'final_plan',
    beforeAgentCallback: createSecurityGateCallback(SECURITY_BLOCK_SKIP_MESSAGE),
  });
}

export const planWriter = createPlanWriter();
