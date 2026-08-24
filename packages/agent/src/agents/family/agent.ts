import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { familyAgentTools } from '../../tools.js';
import { createZeroTrustCallback } from '../../gateway/zero-trust.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');
const instructionText = readFileSync(instructionsPath, 'utf-8');

// Manages family profiles, dietary rules, and activity recommendations.
export function createFamilyAgent(model: string = geminiModel): LlmAgent {
  return new LlmAgent({
    name: 'FamilyAgent',
    model,
    instruction: instructionText,
    tools: familyAgentTools,
    outputKey: 'family_results',
    beforeToolCallback: createZeroTrustCallback('family-agent'),
  });
}

export const familyAgent = createFamilyAgent();
