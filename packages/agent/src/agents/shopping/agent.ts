import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { shoppingAgentTools } from '../../tools.js';
import { createZeroTrustCallback } from '../../gateway/zero-trust.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');
const instructionText = readFileSync(instructionsPath, 'utf-8');

// Identifies destination-specific gear and packing needs.
export function createShoppingAgent(model: string = geminiModel): LlmAgent {
  return new LlmAgent({
    name: 'ShoppingAgent',
    model,
    instruction: instructionText,
    tools: shoppingAgentTools,
    outputKey: 'shopping_results',
    beforeToolCallback: createZeroTrustCallback('shopping-agent'),
  });
}

export const shoppingAgent = createShoppingAgent();
