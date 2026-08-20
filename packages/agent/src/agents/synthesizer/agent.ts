import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');

// Runs LAST — compiles every other agent's output into one final plan.
export const planSynthesizer = new LlmAgent({
  name: 'PlanSynthesizer',
  model: geminiModel,
  instruction: readFileSync(instructionsPath, 'utf-8'),
  tools: [],
  outputKey: 'final_plan',
});
