import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { securityAgentTools } from '../../tools.js';
import { createZeroTrustCallback } from '../../gateway/zero-trust.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');
const instructionText = readFileSync(instructionsPath, 'utf-8');

// Runs FIRST in the pipeline to scan the user's input for threats. A
// factory, not just a singleton, so the model can be chosen per run (see
// packages/agent/src/runner.ts's getLifeGridRunner) — ADK builds an
// LlmAgent's model in at construction time, there's no per-call override.
export function createSecurityScannerAgent(model: string = geminiModel): LlmAgent {
  return new LlmAgent({
    name: 'SecurityScanner',
    model,
    instruction: instructionText,
    tools: securityAgentTools,
    outputKey: 'security_scan_result',
    beforeToolCallback: createZeroTrustCallback('security-agent'),
  });
}

// Default-model singleton — used by anything that just wants "the agent"
// without caring about model choice (scripted mode never even touches
// this; kept for direct imports/tests).
export const securityScannerAgent = createSecurityScannerAgent();
