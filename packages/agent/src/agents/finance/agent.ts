import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { financeAgentTools } from '../../tools.js';
import { createZeroTrustCallback } from '../../gateway/zero-trust.js';
import { createSecurityGateCallback, SECURITY_BLOCK_SKIP_MESSAGE } from '../../gateway/security-gate.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');
const instructionText = readFileSync(instructionsPath, 'utf-8');

// Audits total spend against the budget cap and triggers human approvals.
export function createFinanceAgent(model: string = geminiModel): LlmAgent {
  return new LlmAgent({
    name: 'FinanceAgent',
    model,
    instruction: instructionText,
    tools: financeAgentTools,
    outputKey: 'finance_results',
    beforeToolCallback: createZeroTrustCallback('finance-agent'),
    beforeAgentCallback: createSecurityGateCallback(SECURITY_BLOCK_SKIP_MESSAGE),
  });
}

export const financeAgent = createFinanceAgent();
