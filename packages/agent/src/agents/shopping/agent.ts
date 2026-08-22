import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { shoppingAgentTools } from '../../tools.js';
import { createZeroTrustCallback } from '../../gateway/zero-trust.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');

// Identifies destination-specific gear and packing needs.
export const shoppingAgent = new LlmAgent({
  name: 'ShoppingAgent',
  model: geminiModel,
  instruction: readFileSync(instructionsPath, 'utf-8'),
  tools: shoppingAgentTools,
  outputKey: 'shopping_results',
  beforeToolCallback: createZeroTrustCallback('shopping-agent'),
});
