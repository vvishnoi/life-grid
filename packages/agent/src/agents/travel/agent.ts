import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { travelAgentTools } from '../../tools.js';
import { createZeroTrustCallback } from '../../gateway/zero-trust.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');
const instructionText = readFileSync(instructionsPath, 'utf-8');

// Searches flights and hotels, filtered against Memory Bank preferences.
export function createTravelAgent(model: string = geminiModel): LlmAgent {
  return new LlmAgent({
    name: 'TravelAgent',
    model,
    instruction: instructionText,
    tools: travelAgentTools,
    outputKey: 'travel_results',
    beforeToolCallback: createZeroTrustCallback('travel-agent'),
  });
}

export const travelAgent = createTravelAgent();
