import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { financeAgentTools } from '../../tools.js';
import { createZeroTrustCallback } from '../../gateway/zero-trust.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');

// Audits total spend against the budget cap and triggers human approvals.
export const financeAgent = new LlmAgent({
  name: 'FinanceAgent',
  model: geminiModel,
  instruction: readFileSync(instructionsPath, 'utf-8'),
  tools: financeAgentTools,
  outputKey: 'finance_results',
  beforeToolCallback: createZeroTrustCallback('finance-agent'),
});
